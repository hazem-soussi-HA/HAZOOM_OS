// ═══════════════════════════════════════════════════════════════
// ENGINE: CORE
// Three.js setup, renderer, scene, post-processing
// ═══════════════════════════════════════════════════════════════

const Engine = {
  scene: null,
  camera: null,
  renderer: null,
  composer: null,
  bloom: null,
  quality: 'high',

  init() {
    const q = QUALITY[this.quality];

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030308);
    this.scene.fog = new THREE.FogExp2(0x030308, 0.0008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 10000);

    // Renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: q.antialias,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.error('WebGLRenderer failed:', e);
      throw e;
    }
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, q.pixelRatio));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    if (q.shadows) this.renderer.shadowMap.enabled = true;

    // Tag the WebGL canvas so CSS can pin it to the back of the page.
    // (The AR HUD is drawn into #hud-canvas, which is inside #ui at
    // z-index 5, so the 3D scene will always sit behind the HUD.)
    this.renderer.domElement.id = 'webgl-canvas';
    this.renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1;display:block;outline:none';
    document.body.appendChild(this.renderer.domElement);

    // Post-processing
    this.composer = new THREE.EffectComposer(this.renderer);
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
    if (q.bloom) {
      this.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.5, 0.4, 0.85);
      this.bloom.threshold = 0.1;
      this.bloom.strength = 1.8;
      this.bloom.radius = 0.8;
      this.composer.addPass(this.bloom);
    }

    // Lights
    this.scene.add(new THREE.AmbientLight(0x222244, 0.5));
    const sun = new THREE.DirectionalLight(0x4444ff, 0.3);
    sun.position.set(100, 200, 100);
    this.scene.add(sun);

    // Resize
    window.addEventListener('resize', () => this.resize());

    console.log('[neon-drift] WebGL initialised', {
      size: [innerWidth, innerHeight],
      pixelRatio: this.renderer.getPixelRatio(),
      quality: this.quality,
      context: this.renderer.getContext().constructor.name,
    });
  },

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
    UI.resizeHud();
  },

  setQuality(level) {
    this.quality = level;
    const q = QUALITY[level];
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, q.pixelRatio));
    // Bloom toggle requires re-init, save for restart
    Save.set('quality', level);
  },

  loadSettings() {
    const q = Save.get('quality');
    if (q && QUALITY[q]) this.quality = q;
  }
};
