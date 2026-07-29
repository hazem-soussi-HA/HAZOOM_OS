// JS fallback implementations for when native binaries are unavailable.
// These mirror the x86-64 assembly algorithms exactly.

function hash2i(i, j) {
  return ((i * 127 + j * 311) ^ ((i * 269) + (j * 173))) & 0x7FFFFFFF;
}

function noise2d(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const n00 = hash2i(ix, iz) / 2147483648;
  const n10 = hash2i(ix + 1, iz) / 2147483648;
  const n01 = hash2i(ix, iz + 1) / 2147483648;
  const n11 = hash2i(ix + 1, iz + 1) / 2147483648;
  return (n00 + (n10 - n00) * sx) + ((n01 + (n11 - n01) * sx) - (n00 + (n10 - n00) * sx)) * sz;
}

function fbm(x, z, octaves = 6) {
  let v = 0, a = 1;
  for (let i = 0; i < octaves; i++) {
    v += a * noise2d(x, z);
    x *= 2; z *= 2; a *= 0.5;
  }
  return v;
}

// ---- TERRAIN GENERATOR (mirrors terrain_gen.asm) ----
function generateTerrain(params = {}) {
  const GW = params.gridW || 256;
  const GH = params.gridH || 256;
  const SC = params.scale || 20;
  const HM = params.heightMul || 4;

  const heightmap = new Float32Array(GW * GH);
  const normals = new Float32Array(GW * GH * 3);
  const colors = new Float32Array(GW * GH * 4);

  // Height generation
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const wx = (i / GW) * SC - SC / 2;
      const wz = (j / GH) * SC - SC / 2;

      let h = fbm(wx * 0.08, wz * 0.08) * HM;

      // Valley modulation
      const vn = noise2d(wx * 0.04 + 99, wz * 0.04);
      const vf = Math.max(0, Math.min(1, (vn - 0.25) * 2));
      h *= (0.25 + 0.5 * vf);

      heightmap[j * GW + i] = h;
    }
  }

  // Normals (central differences)
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const il = Math.max(0, i - 1), ir = Math.min(GW - 1, i + 1);
      const jt = Math.max(0, j - 1), jb = Math.min(GH - 1, j + 1);
      const dx = (heightmap[j * GW + ir] - heightmap[j * GW + il]) * 0.5;
      const dz = (heightmap[jb * GW + i] - heightmap[jt * GW + i]) * 0.5;
      const len = Math.sqrt(dx * dx + 4 + dz * dz);
      const idx = (j * GW + i) * 3;
      normals[idx] = -dx / len;
      normals[idx + 1] = 2 / len;
      normals[idx + 2] = -dz / len;
    }
  }

  // Colors (cascading terrain bands)
  const SAND_R = 0.7, SAND_G = 0.6, SAND_B = 0.35;
  const GRASS_R = 0.2, GRASS_G = 0.5, GRASS_B = 0.1;
  const DIRT_R = 0.35, DIRT_G = 0.25, DIRT_B = 0.12;
  const ROCK_R = 0.45, ROCK_G = 0.42, ROCK_B = 0.38;
  const SNOW_R = 0.92, SNOW_G = 0.94, SNOW_B = 0.97;

  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const h = heightmap[j * GW + i];
      let r = GRASS_R, g = GRASS_G, b = GRASS_B;

      // Sand→grass (h: -0.5 → 0.5)
      let t = Math.max(0, Math.min(1, (h + 0.5) / 1.0));
      r += (SAND_R - GRASS_R) * (1 - t);
      g += (SAND_G - GRASS_G) * (1 - t);
      b += (SAND_B - GRASS_B) * (1 - t);

      // Grass→dirt (h: 0.5 → 2.0)
      t = Math.max(0, Math.min(1, (h - 0.5) / 1.5));
      r += (DIRT_R - GRASS_R) * t;
      g += (DIRT_G - GRASS_G) * t;
      b += (DIRT_B - GRASS_B) * t;

      // Dirt→rock (h: 2.0 → 4.0)
      t = Math.max(0, Math.min(1, (h - 2.0) / 2.0));
      r += (ROCK_R - DIRT_R) * t;
      g += (ROCK_G - DIRT_G) * t;
      b += (ROCK_B - DIRT_B) * t;

      // Rock→snow (h: 4.0 → 6.0)
      t = Math.max(0, Math.min(1, (h - 4.0) / 2.0));
      r += (SNOW_R - ROCK_R) * t;
      g += (SNOW_G - ROCK_G) * t;
      b += (SNOW_B - ROCK_B) * t;

      const idx = (j * GW + i) * 4;
      colors[idx] = Math.max(0, Math.min(1, r));
      colors[idx + 1] = Math.max(0, Math.min(1, g));
      colors[idx + 2] = Math.max(0, Math.min(1, b));
      colors[idx + 3] = 1.0;
    }
  }

  // Indices
  const indices = [];
  for (let j = 0; j < GH - 1; j++) {
    for (let i = 0; i < GW - 1; i++) {
      const a = j * GW + i;
      indices.push(a, a + GW, a + 1, a + 1, a + GW, a + GW + 1);
    }
  }

  // Build vertex data (pos3 + normal3 + color4 = 10 floats = 40 bytes)
  const verts = new Float32Array(GW * GH * 10);
  let off = 0;
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const wx = (i / GW) * SC - SC / 2;
      const wz = (j / GH) * SC - SC / 2;
      const h = heightmap[j * GW + i];
      const ni = (j * GW + i) * 3;
      const ci = (j * GW + i) * 4;

      verts[off++] = wx;
      verts[off++] = h;
      verts[off++] = wz;
      verts[off++] = normals[ni];
      verts[off++] = normals[ni + 1];
      verts[off++] = normals[ni + 2];
      verts[off++] = colors[ci];
      verts[off++] = colors[ci + 1];
      verts[off++] = colors[ci + 2];
      verts[off++] = colors[ci + 3];
    }
  }

  return {
    gridW: GW,
    gridH: GH,
    vertexCount: GW * GH,
    indexCount: indices.length,
    positions: Array.from(new Float32Array(GW * GH * 3).map((_, i) => verts[i / 10 * 10])),
    vertices: Array.from(verts),
    indices: indices,
    heightmap: Array.from(heightmap)
  };
}

// ---- EARTH SIMULATION (mirrors earth_sim.asm) ----
function generateEarth(params = {}) {
  const GW = params.gridW || 512;
  const GH = params.gridH || 256;

  const plateSeedsX = [.15,.42,.73,.28,.88,.55,.05,.92,.33,.67,.12,.48,.79,.22,.61,.85];
  const plateSeedsY = [.25,.68,.42,.15,.82,.35,.58,.12,.92,.08,.55,.75,.32,.48,.18,.65];
  const plateElev = [.3,-.1,.5,.2,-.2,.4,.1,-.3,.6,0,-.15,.35,.25,-.25,.45,.15];

  const elevation = new Float32Array(GW * GH);
  const temperature = new Float32Array(GW * GH);
  const precipitation = new Float32Array(GW * GH);
  const biomeMap = new Uint8Array(GW * GH);
  const vegetation = new Float32Array(GW * GH);

  // Phase 1: Continental plates (Voronoi)
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      let bestDist = Infinity, bestPlate = 0;
      const nx = i / GW, ny = j / GH;
      for (let p = 0; p < 16; p++) {
        let dx = nx - plateSeedsX[p], dy = ny - plateSeedsY[p];
        if (dx > .5) dx--; if (dx < -.5) dx++;
        const d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; bestPlate = p; }
      }
      let e = plateElev[bestPlate] + Math.max(0, 0.5 - Math.sqrt(bestDist)) * 2;
      elevation[j * GW + i] = e;
    }
  }

  // Phase 2: Fractal detail
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const x = (i / GW) * Math.PI * 2, z = (j / GH) * Math.PI;
      elevation[j * GW + i] += fbm(x, z, 6) * 0.3;
    }
  }

  // Phase 3: Tectonic mountains (simplified)
  for (let j = 1; j < GH - 1; j++) {
    for (let i = 1; i < GW - 1; i++) {
      const cur = elevation[j * GW + i];
      const n = elevation[(j-1) * GW + i];
      const s = elevation[(j+1) * GW + i];
      const w = elevation[j * GW + i - 1];
      const ne = elevation[(j-1) * GW + i + 1];
      if (Math.abs(cur - n) > 0.15 || Math.abs(cur - s) > 0.15 ||
          Math.abs(cur - w) > 0.15 || Math.abs(cur - ne) > 0.15) {
        elevation[j * GW + i] += 0.3 + (hash2i(i, j) & 0xFF) / 256 * 0.5;
      }
    }
  }

  // Phase 4: Thermal erosion (3 iterations)
  for (let iter = 0; iter < 3; iter++) {
    const buf = new Float32Array(elevation);
    for (let j = 0; j < GH; j++) {
      for (let i = 0; i < GW; i++) {
        const h = elevation[j * GW + i];
        const il = Math.max(0, i - 1), ir = Math.min(GW - 1, i + 1);
        const jt = Math.max(0, j - 1), jb = Math.min(GH - 1, j + 1);
        const hMin = Math.min(
          elevation[j * GW + il], elevation[j * GW + ir],
          elevation[jt * GW + i], elevation[jb * GW + i]
        );
        if (h - hMin > 0.5) {
          buf[j * GW + i] = h - 0.5;
        }
      }
    }
    elevation.set(buf);
  }

  // Phase 5: Hydraulic erosion (3 iterations)
  for (let iter = 0; iter < 3; iter++) {
    for (let j = 0; j < GH; j++) {
      for (let i = 0; i < GW; i++) {
        const il = Math.max(0, i - 1), ir = Math.min(GW - 1, i + 1);
        const jt = Math.max(0, j - 1), jb = Math.min(GH - 1, j + 1);
        const h = elevation[j * GW + i];
        const hMin = Math.min(
          elevation[j * GW + il], elevation[j * GW + ir],
          elevation[jt * GW + i], elevation[jb * GW + i]
        );
        if (h > hMin) {
          const diff = h - hMin;
          const erode = Math.min(diff * 0.05, 0.02);
          elevation[j * GW + i] -= erode;
        }
      }
    }
  }

  // Phase 6: Temperature
  const lapseRate = 0.0065;
  const seaLevel = 0.45;
  for (let j = 0; j < GH; j++) {
    const latFactor = 1 - Math.abs(j / GH - 0.5) * 2;
    for (let i = 0; i < GW; i++) {
      const elev = elevation[j * GW + i];
      temperature[j * GW + i] = Math.max(0, latFactor - Math.max(0, elev - seaLevel) * lapseRate * 100);
    }
  }

  // Phase 7: Precipitation
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const lat = Math.abs(j / GH - 0.5) * 2;
      let precip = Math.max(0, 1 - 3 * Math.abs(lat - 0.15));
      precip = Math.min(1, precip + Math.max(0, elevation[j * GW + i] - seaLevel) * 0.3);
      precipitation[j * GW + i] = Math.min(1, precip);
    }
  }

  // Phase 8: Biomes (Whittaker)
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      const e = elevation[j * GW + i];
      if (e < seaLevel) { biomeMap[j * GW + i] = 0; continue; }
      const t = temperature[j * GW + i];
      const p = precipitation[j * GW + i];

      if (t < 0.05) biomeMap[j * GW + i] = 9;
      else if (t < 0.15) biomeMap[j * GW + i] = 1;
      else if (t < 0.30) biomeMap[j * GW + i] = 2;
      else if (t < 0.50) biomeMap[j * GW + i] = 3;
      else if (p < 0.35) biomeMap[j * GW + i] = 6;
      else if (t < 0.70) biomeMap[j * GW + i] = 4;
      else biomeMap[j * GW + i] = p < 0.55 ? 7 : 8;
    }
  }

  // Phase 9: Vegetation
  const vegMap = [0, 0.2, 0.6, 0.8, 0.7, 0.9, 0.1, 0.5, 1.0, 0, 0.3];
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      vegetation[j * GW + i] = vegMap[biomeMap[j * GW + i]] || 0;
    }
  }

  return {
    gridW: GW, gridH: GH,
    elevation: Array.from(elevation),
    temperature: Array.from(temperature),
    precipitation: Array.from(precipitation),
    biomeMap: Array.from(biomeMap),
    vegetation: Array.from(vegetation)
  };
}

module.exports = { generateTerrain, generateEarth, hash2i, noise2d, fbm };
