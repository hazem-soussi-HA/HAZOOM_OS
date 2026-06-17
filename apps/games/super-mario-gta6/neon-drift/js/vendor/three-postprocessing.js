// ═══════════════════════════════════════════════════════════════
// VENDOR: Three.js post-processing (patched for global THREE)
// Source: three@0.160.0/examples/jsm/postprocessing/
// Patched to use global THREE instead of ES module imports
// ═══════════════════════════════════════════════════════════════

// --- Pass.js ---
THREE.Pass = class Pass {
  constructor() { this.enabled = true; this.needsSwap = true; this.renderToScreen = false; }
  setSize(w, h) {}
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) { console.error('Pass: .render() must be implemented in derived pass'); }
};

// --- CopyShader.js ---
THREE.CopyShader = {
  uniforms: { tDiffuse: { value: null }, opacity: { value: 1.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform float opacity; uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 texel=texture2D(tDiffuse,vUv); gl_FragColor=opacity*texel; }`
};

// --- FullScreenQuad (defined on THREE.Pass BEFORE ShaderPass uses it) ---
THREE.Pass.FullScreenQuad = (() => {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const _mesh = new THREE.Mesh(geometry);
  return class FullScreenQuad {
    constructor(material) { this._mesh = material ? new THREE.Mesh(geometry, material) : _mesh; }
    render(renderer) { renderer.render(this._mesh, camera); }
    dispose() { this._mesh.geometry.dispose(); }
  };
})();
THREE.ShaderPass = THREE.ShaderPass || {};
THREE.ShaderPass.FullScreenQuad = THREE.Pass.FullScreenQuad;

// --- ShaderPass.js ---
THREE.ShaderPass = class ShaderPass extends THREE.Pass {
  constructor(shader, textureID) {
    super();
    this.textureID = textureID || 'tDiffuse';
    if (shader instanceof THREE.ShaderMaterial) {
      this.uniforms = shader.uniforms;
      this.material = shader;
    } else if (shader) {
      this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
      this.material = new THREE.ShaderMaterial({
        uniforms: this.uniforms, vertexShader: shader.vertexShader, fragmentShader: shader.fragmentShader
      });
    }
    this.fsQuad = new THREE.Pass.FullScreenQuad(this.material);
  }
  render(renderer, writeBuffer, readBuffer, deltaTime) {
    if (this.uniforms[this.textureID]) this.uniforms[this.textureID].value = readBuffer.texture;
    if (this.renderToScreen) { renderer.setRenderTarget(null); this.fsQuad.render(renderer); }
    else { renderer.setRenderTarget(writeBuffer); if (this.clear) renderer.clear(); this.fsQuad.render(renderer); }
  }
};

// --- RenderPass.js ---
THREE.RenderPass = class RenderPass extends THREE.Pass {
  constructor(scene, camera, overrideMaterial, clearColor, clearAlpha) {
    super();
    this.scene = scene; this.camera = camera;
    this.overrideMaterial = overrideMaterial;
    this.clearColor = clearColor; this.clearAlpha = clearAlpha || 0;
    this.clear = true; this.clearDepth = false; this.needsSwap = false;
  }
  render(renderer, writeBuffer, readBuffer, deltaTime) {
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    let oldClearColor, oldClearAlpha;
    if (this.clearColor) { oldClearColor = renderer.getClearColor(new THREE.Color()); oldClearAlpha = renderer.getClearAlpha(); renderer.setClearColor(this.clearColor, this.clearAlpha); }
    if (this.clearDepth) renderer.clearDepth();
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    // Only set overrideMaterial if defined — three.js's `overrideMaterial !== null` check
    // returns true for `undefined`, which would break rendering with a null material
    const prevOverride = this.scene.overrideMaterial;
    this.scene.overrideMaterial = this.overrideMaterial !== undefined ? this.overrideMaterial : null;
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = prevOverride;
    if (this.clearColor) renderer.setClearColor(oldClearColor, oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
};

// --- MaskPass.js ---
THREE.MaskPass = class MaskPass extends THREE.Pass {
  constructor(scene, camera) { super(); this.scene = scene; this.camera = camera; this.clear = true; this.needsSwap = false; this.inverse = false; }
  render(renderer, writeBuffer, readBuffer, deltaTime) {
    const context = renderer.state.buffers;
    context.color.setMask(false); context.depth.setTest(false); context.depth.setMask(false);
    context.color.setLocked(true); context.depth.setLocked(true);
    let val;
    if (this.inverse) val = 0; else val = 1;
    context.stencil.setTest(true); context.stencil.setOp(context.stencil.REPLACE, context.stencil.REPLACE, context.stencil.REPLACE);
    context.stencil.setFunc(context.stencil.ALWAYS, val, 0xffffffff); context.stencil.setClear(val);
    renderer.setRenderTarget(readBuffer); if (this.clear) renderer.clear(); renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(writeBuffer); if (this.clear) renderer.clear(); renderer.render(this.scene, this.camera);
    context.color.setLocked(false); context.depth.setLocked(false);
    context.stencil.setFunc(context.stencil.EQUAL, 1, 0xffffffff); context.stencil.setOp(context.stencil.KEEP, context.stencil.KEEP, context.stencil.KEEP);
  }
};

// --- EffectComposer.js ---
THREE.EffectComposer = class EffectComposer {
  constructor(renderer, renderTarget) {
    this.renderer = renderer;
    if (renderTarget === undefined) {
      const size = renderer.getSize(new THREE.Vector2());
      const pixelRatio = renderer.getPixelRatio();
      renderTarget = new THREE.WebGLRenderTarget(size.width * pixelRatio, size.height * pixelRatio);
      renderTarget.texture.name = 'EffectComposer.rt1';
    }
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.renderTarget2.texture.name = 'EffectComposer.rt2';
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
    this.passes = [];
    this.clock = new THREE.Clock();
    this.copyPass = new THREE.ShaderPass(THREE.CopyShader);
  }
  swapBuffers() {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  }
  addPass(pass) { this.passes.push(pass); }
  render(deltaTime) {
    if (deltaTime === undefined) deltaTime = this.clock.getDelta();
    for (const pass of this.passes) { pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, false); if (pass.needsSwap) this.swapBuffers(); }
  }
  setSize(width, height) {
    const pixelRatio = this.renderer.getPixelRatio();
    this.renderTarget1.setSize(width * pixelRatio, height * pixelRatio);
    this.renderTarget2.setSize(width * pixelRatio, height * pixelRatio);
    for (const pass of this.passes) pass.setSize(width, height);
  }
};

// --- LuminosityHighPassShader.js ---
THREE.LuminosityHighPassShader = {
  uniforms: { tDiffuse: { value: null }, luminosityThreshold: { value: 1.0 }, smoothWidth: { value: 1.0 }, defaultColor: { value: new THREE.Color(0x000000) }, defaultOpacity: { value: 0.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 defaultColor; uniform float defaultOpacity; uniform float luminosityThreshold; uniform float smoothWidth; varying vec2 vUv; void main(){ vec4 texel=texture2D(tDiffuse,vUv); vec3 luma=vec3(0.299,0.587,0.114); float v=dot(texel.xyz,luma); vec4 outputColor=vec4(defaultColor.rgb,defaultOpacity); float alpha=smoothstep(luminosityThreshold,luminosityThreshold+smoothWidth,v); gl_FragColor=mix(outputColor,texel,alpha); }`
};

// --- UnrealBloomPass.js ---
THREE.UnrealBloomPass = class UnrealBloomPass extends THREE.Pass {
  constructor(resolution, strength, radius, threshold) {
    super();
    this.strength = (strength !== undefined) ? strength : 1;
    this.radius = radius;
    this.threshold = threshold;
    this.resolution = (resolution !== undefined) ? new THREE.Vector2(resolution.x, resolution.y) : new THREE.Vector2(256, 256);
    const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
    this.renderTargetsHorizontal = [];
    this.renderTargetsVertical = [];
    this.nMips = 5;
    let resx = Math.round(this.resolution.x / 2);
    let resy = Math.round(this.resolution.y / 2);
    this.renderTargetBright = new THREE.WebGLRenderTarget(resx, resy, pars);
    this.renderTargetBright.texture.name = 'UnrealBloomPass.bright';
    for (let i = 0; i < this.nMips; i++) {
      const rth = new THREE.WebGLRenderTarget(resx, resy, pars);
      rth.texture.name = 'UnrealBloomPass.h' + i;
      this.renderTargetsHorizontal.push(rth);
      const rtv = new THREE.WebGLRenderTarget(resx, resy, pars);
      rtv.texture.name = 'UnrealBloomPass.v' + i;
      this.renderTargetsVertical.push(rtv);
      resx = Math.round(resx / 2); resy = Math.round(resy / 2);
    }
    this.separableBlurMaterials = [];
    const kernelSizeArray = [3, 5, 7, 9, 11];
    resx = Math.round(this.resolution.x / 2); resy = Math.round(this.resolution.y / 2);
    for (let i = 0; i < this.nMips; i++) {
      this.separableBlurMaterials.push(this.getSeperableBlurMaterial(kernelSizeArray[i]));
      this.separableBlurMaterials[i].uniforms['texSize'].value = new THREE.Vector2(resx, resy);
      resx = Math.round(resx / 2); resy = Math.round(resy / 2);
    }
    this.compositeMaterial = this.getCompositeMaterial(this.nMips);
    this.compositeMaterial.uniforms['blurTexture1'].value = this.renderTargetsVertical[0].texture;
    this.compositeMaterial.uniforms['blurTexture2'].value = this.renderTargetsVertical[1].texture;
    this.compositeMaterial.uniforms['blurTexture3'].value = this.renderTargetsVertical[2].texture;
    this.compositeMaterial.uniforms['blurTexture4'].value = this.renderTargetsVertical[3].texture;
    this.compositeMaterial.uniforms['blurTexture5'].value = this.renderTargetsVertical[4].texture;
    this.compositeMaterial.uniforms['bloomStrength'].value = this.strength;
    this.compositeMaterial.uniforms['bloomRadius'].value = 0.1;
    const bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
    this.compositeMaterial.uniforms['bloomFactors'].value = bloomFactors;
    this.bloomTintColors = [new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1)];
    this.compositeMaterial.uniforms['bloomTintColors'].value = this.bloomTintColors;
    this.highPassUniforms = THREE.UniformsUtils.clone(THREE.LuminosityHighPassShader.uniforms);
    this.highPassUniforms['luminosityThreshold'].value = threshold;
    this.highPassUniforms['smoothWidth'].value = 0.01;
    this.materialHighPassFilter = new THREE.ShaderMaterial({
      uniforms: this.highPassUniforms, vertexShader: THREE.LuminosityHighPassShader.vertexShader, fragmentShader: THREE.LuminosityHighPassShader.fragmentShader
    });
    this.separableBlurMaterialsRes = [];
    this.oldClearColor = new THREE.Color();
    this.oldClearAlpha = 1;
    this.basic = new THREE.MeshBasicMaterial();
    this.fsQuad = new THREE.Pass.FullScreenQuad(null);
  }
  dispose() {
    for (let i = 0; i < this.renderTargetsHorizontal.length; i++) this.renderTargetsHorizontal[i].dispose();
    for (let i = 0; i < this.renderTargetsVertical.length; i++) this.renderTargetsVertical[i].dispose();
    this.renderTargetBright.dispose();
  }
  setSize(width, height) {
    let resx = Math.round(width / 2); let resy = Math.round(height / 2);
    this.renderTargetBright.setSize(resx, resy);
    for (let i = 0; i < this.nMips; i++) {
      this.renderTargetsHorizontal[i].setSize(resx, resy);
      this.renderTargetsVertical[i].setSize(resx, resy);
      this.separableBlurMaterials[i].uniforms['texSize'].value = new THREE.Vector2(resx, resy);
      resx = Math.round(resx / 2); resy = Math.round(resy / 2);
    }
  }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    this.oldClearColor.copy(renderer.getClearColor(new THREE.Color()));
    this.oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear; renderer.autoClear = false;
    renderer.setClearColor(new THREE.Color(0, 0, 0), 0);
    if (maskActive) renderer.state.buffers.stencil.setTest(false);
    this.highPassUniforms['tDiffuse'].value = readBuffer.texture;
    this.highPassUniforms['luminosityThreshold'].value = this.threshold;
    this.fsQuad.material = this.materialHighPassFilter;
    renderer.setRenderTarget(this.renderTargetBright); renderer.clear(); this.fsQuad.render(renderer);
    let inputRenderTarget = this.renderTargetBright;
    for (let i = 0; i < this.nMips; i++) {
      this.fsQuad.material = this.separableBlurMaterials[i];
      this.separableBlurMaterials[i].uniforms['colorTexture'].value = inputRenderTarget.texture;
      this.separableBlurMaterials[i].uniforms['direction'].value = new THREE.Vector2(1.0, 0.0);
      renderer.setRenderTarget(this.renderTargetsHorizontal[i]); renderer.clear(); this.fsQuad.render(renderer);
      this.separableBlurMaterials[i].uniforms['colorTexture'].value = this.renderTargetsHorizontal[i].texture;
      this.separableBlurMaterials[i].uniforms['direction'].value = new THREE.Vector2(0.0, 1.0);
      renderer.setRenderTarget(this.renderTargetsVertical[i]); renderer.clear(); this.fsQuad.render(renderer);
      inputRenderTarget = this.renderTargetsVertical[i];
    }
    this.fsQuad.material = this.compositeMaterial;
    this.compositeMaterial.uniforms['bloomStrength'].value = this.strength;
    this.compositeMaterial.uniforms['bloomRadius'].value = this.radius;
    renderer.setRenderTarget(this.renderTargetsHorizontal[0]); renderer.clear(); this.fsQuad.render(renderer);
    this.fsQuad.material = this.basic;
    this.basic.map = readBuffer.texture;
    if (this.renderToScreen) { renderer.setRenderTarget(null); this.fsQuad.render(renderer); }
    else { renderer.setRenderTarget(writeBuffer); this.fsQuad.render(renderer); }
    renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
  getSeperableBlurMaterial(kernelRadius) {
    return new THREE.ShaderMaterial({
      defines: { 'KERNEL_RADIUS': kernelRadius },
      uniforms: { 'colorTexture': { value: null }, 'texSize': { value: new THREE.Vector2(0.5, 0.5) }, 'direction': { value: new THREE.Vector2(0.5, 0.5) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `#include <common> varying vec2 vUv; uniform sampler2D colorTexture; uniform vec2 texSize; uniform vec2 direction; float gaussianPdf(in float x, in float sigma){ return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma; } void main(){ vec2 invSize=1.0/texSize; float fSigma=float(KERNEL_RADIUS); float weightSum=gaussianPdf(0.0,fSigma); vec3 diffuseSum=texture2D(colorTexture,vUv).rgb*weightSum; for(int i=1;i<10;i++){ if(i>KERNEL_RADIUS) break; float x=float(i); float w=gaussianPdf(x,fSigma); vec2 uvOffset=direction*invSize*x; vec3 sample1=texture2D(colorTexture,vUv+uvOffset).rgb; vec3 sample2=texture2D(colorTexture,vUv-uvOffset).rgb; diffuseSum+=(sample1+sample2)*w; weightSum+=2.0*w; } gl_FragColor=vec4(diffuseSum/weightSum,1.0); }`
    });
  }
  getCompositeMaterial(nMips) {
    return new THREE.ShaderMaterial({
      defines: { 'NUM_MIPS': nMips },
      uniforms: { 'blurTexture1': { value: null }, 'blurTexture2': { value: null }, 'blurTexture3': { value: null }, 'blurTexture4': { value: null }, 'blurTexture5': { value: null }, 'bloomStrength': { value: 1.0 }, 'bloomFactors': { value: null }, 'bloomTintColors': { value: null }, 'bloomRadius': { value: 0.0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform sampler2D blurTexture1; uniform sampler2D blurTexture2; uniform sampler2D blurTexture3; uniform sampler2D blurTexture4; uniform sampler2D blurTexture5; uniform float bloomStrength; uniform float bloomRadius; uniform float bloomFactors[NUM_MIPS]; uniform vec3 bloomTintColors[NUM_MIPS]; float lerpBloomFactor(const in float factor){ float mirrorFactor=1.2-factor; return mix(factor,mirrorFactor,bloomRadius); } void main(){ gl_FragColor=bloomStrength*(lerpBloomFactor(bloomFactors[0])*vec4(bloomTintColors[0],1.0)*texture2D(blurTexture1,vUv)+lerpBloomFactor(bloomFactors[1])*vec4(bloomTintColors[1],1.0)*texture2D(blurTexture2,vUv)+lerpBloomFactor(bloomFactors[2])*vec4(bloomTintColors[2],1.0)*texture2D(blurTexture3,vUv)+lerpBloomFactor(bloomFactors[3])*vec4(bloomTintColors[3],1.0)*texture2D(blurTexture4,vUv)+lerpBloomFactor(bloomFactors[4])*vec4(bloomTintColors[4],1.0)*texture2D(blurTexture5,vUv)); }`
    });
  }
};
