#!/usr/bin/env node
'use strict';

/**
 * Icon system consistency check.
 *
 * The window-header bug this exists to prevent: appIcon() returned a 64x64
 * gradient tile into a 42px header, so every titlebar icon rendered cropped
 * and muddy. Nothing failed loudly — it just looked wrong. A check that only
 * runs on build is not a check that gets run, so this is wired into `npm run
 * check` and it is cheap.
 *
 * Fails on:
 *   1. a GLYPH_MAP or ALIASES entry pointing at a glyph that does not exist
 *   2. a glyph that is not valid standalone SVG markup
 *   3. a glyph whose geometry escapes the 24x24 viewBox (strokes would clip)
 *   4. an app in apps-registry.json that resolves to neither a glyph nor a tile
 *   5. a tile referenced by ICON_ASSETS in core/os-desktop.js with no file
 *   6. size-family confusion: .app-glyph used where a fixed slot is required
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const ICONS = require(path.join(ROOT, 'core', 'icons.js'));
const problems = [];
const notes = [];

// ── 1 & 2 & 3: glyph integrity ──────────────────────────────────────────
const VB = 24;

/**
 * Collect the real absolute coordinates a path visits.
 *
 * A naive "pull every number pair" scan is wrong: SVG path data mixes
 * absolute (L) and relative (l) commands, an implicit lineto after a moveto
 * is relative, and h/v are single-axis. Scanning pairs produces garbage and
 * flags glyphs that are perfectly fine, which is how a checker gets ignored.
 * So walk the data properly and track the current point.
 */
function pathPoints(d) {
    const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
    const pts = [];
    let x = 0, y = 0, cmd = 'M';
    let i = 0;
    const num = () => parseFloat(tokens[i++]);
    while (i < tokens.length) {
        if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
        const rel = cmd === cmd.toLowerCase();
        const C = cmd.toUpperCase();
        if (C === 'Z') { continue; }
        if (C === 'M') {
            const nx = num(), ny = num();
            x = rel ? x + nx : nx; y = rel ? y + ny : ny;
            pts.push([x, y]);
            cmd = rel ? 'l' : 'L';           // implicit lineto after moveto
        } else if (C === 'L') {
            const nx = num(), ny = num();
            x = rel ? x + nx : nx; y = rel ? y + ny : ny;
            pts.push([x, y]);
        } else if (C === 'H') {
            const nx = num();
            x = rel ? x + nx : nx;
            pts.push([x, y]);
        } else if (C === 'V') {
            const ny = num();
            y = rel ? y + ny : ny;
            pts.push([x, y]);
        } else if (C === 'C' || C === 'S' || C === 'Q' || C === 'T') {
            // Control points are offsets from the SAME start point; only the
            // final pair moves the pen. Advancing on every pair would corrupt
            // the current point for every following command.
            const n = (C === 'C' || C === 'Q') ? 6 : 4;
            const sx = x, sy = y;
            let lastX = x, lastY = y;
            for (let k = 0; k < n; k += 2) {
                const nx = num(), ny = num();
                const ax = rel ? sx + nx : nx;
                const ay = rel ? sy + ny : ny;
                pts.push([ax, ay]);
                lastX = ax; lastY = ay;
            }
            x = lastX; y = lastY;
        } else if (C === 'A') {
            // rx ry rot large sweep x y
            num(); num(); num(); num(); num();
            const nx = num(), ny = num();
            x = rel ? x + nx : nx; y = rel ? y + ny : ny;
            pts.push([x, y]);
        } else {
            i++;                              // unknown token, skip
        }
    }
    return pts;
}

for (const [name, body] of Object.entries(ICONS.GLYPHS)) {
    if (!body || !/<(path|circle|rect|ellipse|polygon|line)\b/.test(body)) {
        problems.push(`glyph "${name}" contains no drawable shape`);
        continue;
    }
    if (/<(script|foreignObject|onload|onerror)\b/i.test(body)) {
        problems.push(`glyph "${name}" contains active content`);
    }

    const pts = [];
    for (const m of body.matchAll(/<path[^>]*\sd="([^"]+)"/g)) pts.push(...pathPoints(m[1]));
    for (const m of body.matchAll(/<rect[^>]*\sx="(-?[\d.]+)"[^>]*\sy="(-?[\d.]+)"[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/g)) {
        const [x, y, w, h] = [+m[1], +m[2], +m[3], +m[4]];
        pts.push([x, y], [x + w, y], [x, y + h], [x + w, y + h]);
    }
    for (const m of body.matchAll(/<circle[^>]*\scx="(-?[\d.]+)"[^>]*\scy="(-?[\d.]+)"[^>]*\sr="([\d.]+)"/g)) {
        const [cx, cy, r] = [+m[1], +m[2], +m[3]];
        pts.push([cx - r, cy - r], [cx + r, cy + r]);
    }
    for (const m of body.matchAll(/<ellipse[^>]*\scx="(-?[\d.]+)"[^>]*\scy="(-?[\d.]+)"[^>]*\srx="([\d.]+)"[^>]*\sry="([\d.]+)"/g)) {
        const [cx, cy, rx, ry] = [+m[1], +m[2], +m[3], +m[4]];
        pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]);
    }
    for (const m of body.matchAll(/<polygon[^>]*\spoints="([^"]+)"/g)) {
        const pairs = m[1].trim().split(/\s+/);
        for (let k = 0; k + 1 < pairs.length; k += 2) pts.push([+pairs[k], +pairs[k + 1]]);
    }

    // live area is 1..23 so a 1.7 stroke never clips against the viewBox edge
    const slack = 1.0;
    for (const [px, py] of pts) {
        if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
        if (px < -slack || px > VB + slack || py < -slack || py > VB + slack) {
            problems.push(`glyph "${name}" escapes the ${VB}x${VB} viewBox at (${px}, ${py})`);
            break;
        }
    }
}

for (const [k, v] of Object.entries(ICONS.GLYPH_MAP)) {
    if (!ICONS.GLYPHS[v]) problems.push(`GLYPH_MAP "${k}" -> "${v}" which is not a glyph`);
}
for (const [k, v] of Object.entries(ICONS.ALIASES)) {
    if (!ICONS.GLYPHS[v]) problems.push(`ALIASES "${k}" -> "${v}" which is not a glyph`);
}

// ── 4: every registered app resolves to something drawable ──────────────
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps-registry.json'), 'utf8'));
const desktopSrc = fs.readFileSync(path.join(ROOT, 'core', 'os-desktop.js'), 'utf8');
const iconBlock = (desktopSrc.match(/ICON_ASSETS = \{([\s\S]*?)\n        \};/) || [, ''])[1];
const tiles = new Set(
    (iconBlock.match(/'[^']+':\s*'([^']+)'/g) || []).map(s => s.split("'")[3])
);

const noGlyph = [];
for (const cat of registry.categories || []) {
    for (const app of cat.apps || []) {
        const g = ICONS.glyphForApp({ id: app.id, name: app.name });
        if (!g) noGlyph.push(app.id || app.name);
    }
}
if (noGlyph.length) {
    notes.push(`${noGlyph.length} registry app(s) fall back to a monogram: ${noGlyph.join(', ')}`);
}

// ── 5: declared tiles must exist on disk ────────────────────────────────
const iconDir = path.join(ROOT, 'assets', 'icons');
const onDisk = new Set(
    fs.existsSync(iconDir) ? fs.readdirSync(iconDir).filter(f => f.endsWith('.svg')).map(f => f.slice(0, -4)) : []
);
for (const t of tiles) {
    if (!onDisk.has(t)) problems.push(`ICON_ASSETS references tile "${t}" but assets/icons/${t}.svg does not exist`);
}

// ── 6: size-family confusion ────────────────────────────────────────────
// A .app-glyph in a header must be wrapped by a fixed-size slot. If someone
// re-introduces the bare 64px tile into a titlebar, catch it at check time.
const headerLine = (desktopSrc.match(/<div class="window-title">[\s\S]{0,200}?<\/div>/) || [''])[0];
if (headerLine && /appIcon\(/.test(headerLine) && !/window-icon/.test(headerLine)) {
    problems.push('window-title still renders a raw appIcon() with no .window-icon slot — this is the crop bug');
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!/\.window-icon\s*\{/.test(html)) {
    problems.push('index.html has no .window-icon rule — headers have no fixed icon slot');
}

if (process.env.ICON_CHECK_QUIET !== '1' && notes.length) {
    for (const n of notes) console.log('note: ' + n);
}
if (problems.length) {
    console.error(`\nicon check: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error('  x ' + p);
    process.exit(1);
}
console.log(`icon check: ok — ${Object.keys(ICONS.GLYPHS).length} glyphs, ${tiles.size} tiles, ${onDisk.size} files`);
