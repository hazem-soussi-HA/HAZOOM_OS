// Project data for portfolio
// Each project represents a real creation by Hazem Soussi

export const projects = [
  {
    id: 'hazoom-os',
    title: 'HAZOOM OS',
    subtitle: 'A Unix-based Operating System built from scratch',
    category: 'Operating System',
    status: 'active', // active, completed, wip
    description:
      'A complete Unix-based operating system written in Pascal, featuring a custom kernel, memory management, process scheduling, and 70+ bundled applications. Built as an open-source gift to the developer community.',
    longDescription:
      'HAZOOM OS is not just software — it is a mirror of how a mind organizes thought. The kernel is written in Pascal with 9 core modules: aether_engine, neural_core, consciousness, deep_consciousness, syscall_atlas, alpha (Trinity), hazoom_shell, memorymanager, and processmanager. It features a galaxy system with 111K stars, a syscall atlas, and the Alpha energy system. The entire OS is open-source because knowledge belongs to everyone.',
    highlights: [
      '9 Pascal kernel modules compiled to native binaries',
      '70+ bundled applications',
      'Custom memory manager & process scheduler',
      'Galaxy simulation: 111K stars, 12 floats per star',
      'Web terminal interface at /os',
      'Complete syscall atlas',
    ],
    challenges: [
      'Building a kernel in Pascal required deep understanding of memory layout and hardware abstraction',
      'Process scheduling from scratch taught me the true cost of every CPU cycle',
      'Writing 70+ apps revealed the importance of consistent API design',
    ],
    tech: ['Pascal', 'Python', 'React', 'WebGL', 'Docker', 'CI/CD'],
    links: {
      source: 'https://github.com/hazem-soussi-HA/hazoom-os',
      demo: null,
    },
    image: null,
    featured: true,
    year: '2025-2026',
  },
  {
    id: 'mario-gta6',
    title: 'Super Mario GTA6',
    subtitle: 'Therapeutic game engine with healing characters',
    category: 'Game Engine',
    status: 'active',
    description:
      'A 2D game engine combining Super Mario-style platforming with GTA-inspired open world mechanics. Built with original sprites and a core philosophy: games should heal, not harm. Every character carries a therapeutic message.',
    longDescription:
      'Super Mario GTA6 is built on the belief that play is medicine. The engine features original sprite work, physics-based gameplay, and characters designed around emotional healing. It is not about violence or destruction — it is about exploration, growth, and the joy of movement. The therapeutic dimension means every interaction, every level, every character arc is intentional about the emotional experience of the player.',
    highlights: [
      'Custom 2D game engine from scratch',
      'Original sprite artwork & animation system',
      'Physics-based platforming mechanics',
      'Open-world GTA-inspired map design',
      'Therapeutic character design philosophy',
      'Healing-through-play game loop',
    ],
    challenges: [
      'Building a game engine requires understanding rendering, physics, input, and audio as one system',
      'Making characters feel alive demands attention to animation timing and emotional design',
      'Balancing open-world freedom with platforming precision is an art form',
    ],
    tech: ['Python', 'Pygame', 'OpenGL', 'GLSL', 'Rust'],
    links: {
      source: 'https://github.com/hazem-soussi-HA',
      demo: null,
    },
    image: null,
    featured: true,
    year: '2025-2026',
  },
  {
    id: 'neon-drift',
    title: 'Neon Drift',
    subtitle: 'Zero-dependency sky racer in a single file',
    category: 'Game',
    status: 'completed',
    description:
      'A high-speed neon racing game built in a single HTML file with zero dependencies. Features a ghost replay system, procedural track generation, and a minimalist cyberpunk aesthetic.',
    longDescription:
      'Neon Drift proves that constraint breeds creativity. One file. No libraries. No frameworks. Just pure JavaScript, canvas, and a vision. The game features a ghost system that records your best run and races against you, procedural track generation that ensures no two races are the same, and a neon-soaked cyberpunk visual style that runs at 60fps on any device.',
    highlights: [
      'Single HTML file — zero dependencies',
      'Ghost replay system: race against your best run',
      'Procedural track generation',
      'Cyberpunk neon aesthetic',
      '60fps on any device',
      'Keyboard & touch controls',
    ],
    challenges: [
      'Fitting a complete game in one file teaches ruthless prioritization',
      'The ghost system required frame-perfect input recording and playback',
      'Procedural generation is easy to start, hard to make fun',
    ],
    tech: ['JavaScript', 'Canvas API', 'HTML5', 'CSS'],
    links: {
      source: 'https://github.com/hazem-soussi-HA',
      demo: null,
    },
    image: null,
    featured: true,
    year: '2025',
  },
  {
    id: 'hazoom-kernel',
    title: 'HAZOOM Kernel',
    subtitle: 'The forbidden core — Pascal kernel architecture',
    category: 'Kernel',
    status: 'active',
    description:
      'The heart of HAZOOM OS. A custom kernel written in Pascal featuring memory management, process scheduling, interrupt handling, and a syscall interface. This is where software meets silicon.',
    longDescription:
      'The HAZOEM Kernel is the layer between hardware and everything else. Written entirely in Pascal — a language most consider dead — it proves that the right abstractions matter more than trendy syntax. The kernel handles memory allocation, process lifecycle, hardware interrupts, and provides a clean syscall interface that 70+ applications rely on.',
    highlights: [
      'Written entirely in Pascal',
      'Custom memory allocator & garbage collection',
      'Preemptive process scheduler',
      'Hardware interrupt handling',
      'Syscall interface for user-space applications',
      'Modular architecture: 9 kernel modules',
    ],
    challenges: [
      'Kernel debugging is a different universe — one wrong pointer and everything crashes',
      'Writing a scheduler taught me that fairness and performance are always in tension',
      'Pascal forces discipline that modern languages let you skip',
    ],
    tech: ['Pascal', 'Assembly', 'C'],
    links: {
      source: null,
      demo: null,
    },
    image: null,
    featured: false,
    private: true,
    year: '2024-2026',
  },
  {
    id: 'alphapony',
    title: 'Alphapony',
    subtitle: 'AI trained on patterns of creativity',
    category: 'Artificial Intelligence',
    status: 'active',
    description:
      'An AI system trained on personal creative patterns to assist in code generation, game design, and artistic exploration. Alphapony is the intelligence layer that powers creative workflows.',
    longDescription:
      'Alphapony is not a chatbot. It is a creative partner trained on years of personal coding patterns, design decisions, and artistic sensibilities. It understands the philosophy behind HAZOOM OS and Super Mario GTA6, and it helps accelerate the creative process by suggesting code, generating game design documents, and exploring artistic directions.',
    highlights: [
      'Trained on personal creative patterns',
      'Code generation with project-specific style',
      'Game design document assistant',
      'Artistic direction exploration',
      'Integrated into HAZOOM OS workflow',
    ],
    challenges: [
      'Training on personal data requires careful thought about privacy and bias',
      "Making AI creative rather than just mimetic is the hardest problem in the field",
      'Integration with existing workflows must be seamless or it gets ignored',
    ],
    tech: ['Python', 'PyTorch', 'Transformers', 'DSPy'],
    links: {
      source: null,
      demo: null,
    },
    image: null,
    featured: false,
    private: true,
    year: '2025-2026',
  },
  {
    id: 'portfolio',
    title: 'Shadow Portfolio',
    subtitle: 'This portfolio — Vite, React, Tailwind, CI/CD',
    category: 'Web Development',
    status: 'active',
    description:
      'The portfolio you are reading right now. Built with React, Vite, and Tailwind CSS. Deployed via GitHub Actions with strict security headers (CSP, HSTS, XFO). Zero vulnerabilities.',
    longDescription:
      'This portfolio is itself a showcase of modern web development. It uses a component-based architecture, dark terminal-inspired design, and is deployed through a fully automated CI/CD pipeline. Every push triggers a build, security scan, and deployment. The security headers (CSP, HSTS, X-Frame-Options, CORP, COOP) ensure that even a personal portfolio follows enterprise-grade security practices.',
    highlights: [
      'React + Vite + Tailwind CSS',
      'Framer Motion animations',
      'GitHub Actions CI/CD',
      'Security: 0 vulns, full CSP/HSTS/XFO/CORP/COOP',
      'Dark terminal aesthetic with matrix rain',
      'Fully responsive, mobile-first',
    ],
    challenges: [
      'Balancing visual design with performance and accessibility',
      'Security headers on GitHub Pages require creative solutions',
      'Making a personal portfolio feel professional without losing personality',
    ],
    tech: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion', 'GitHub Actions'],
    links: {
      source: 'https://github.com/hazem-soussi-HA/portfolio_final',
      demo: 'https://hazem-soussi-ha.github.io/portfolio_final/',
    },
    image: null,
    featured: false,
    year: '2026',
  },
]

export const upcomingProjects = [
  {
    id: 'hazoom-coin',
    title: 'HAZOOM Coin',
    description: 'Cryptocurrency token with USDT gateway and debit card integration.',
    status: 'planning',
    tech: ['Solidity', 'Web3', 'Rust'],
  },
  {
    id: 'hazoom-v2',
    title: 'HAZOOM OS v2.0',
    description: 'Next iteration with Rust kernel modules and distributed computing.',
    status: 'wip',
    tech: ['Rust', 'Pascal', 'WebGPU'],
  },
]

export const skills = {
  'Systems & Core': [
    { name: 'Pascal', level: 'expert', note: 'Kernel modules, OS core' },
    { name: 'Rust', level: 'intermediate', note: 'Physics, AI systems' },
    { name: 'Python', level: 'expert', note: 'Backend, automation, AI' },
    { name: 'C', level: 'intermediate', note: 'Low-level systems' },
    { name: 'Assembly', level: 'basic', note: 'Boot sequences, interrupts' },
  ],
  'Web & Frontend': [
    { name: 'React', level: 'expert', note: 'OS interface, portfolio' },
    { name: 'TypeScript', level: 'advanced', note: 'Type-safe systems' },
    { name: 'GLSL/Shaders', level: 'intermediate', note: 'Visual effects' },
    { name: 'Tailwind CSS', level: 'advanced', note: 'UI systems' },
    { name: 'Vite', level: 'advanced', note: 'Build tooling' },
  ],
  'DevOps & Infrastructure': [
    { name: 'Docker', level: 'advanced', note: 'Containerization' },
    { name: 'Kubernetes', level: 'advanced', note: 'Orchestration' },
    { name: 'GitHub Actions', level: 'advanced', note: 'CI/CD pipelines' },
    { name: 'Terraform', level: 'intermediate', note: 'Infrastructure as code' },
    { name: 'Linux/WSL', level: 'expert', note: 'Daily driver' },
  ],
  'Security': [
    { name: 'CSP/HSTS', level: 'advanced', note: 'Security headers' },
    { name: 'SSL/TLS', level: 'intermediate', note: 'Encryption' },
    { name: 'Audit & Hardening', level: 'intermediate', note: 'Vuln scanning' },
    { name: 'Vault/Secrets', level: 'intermediate', note: 'Secrets management' },
  ],
  'Game Development': [
    { name: 'Game Engines', level: 'advanced', note: 'Custom 2D engine' },
    { name: 'OpenGL/WebGL', level: 'intermediate', note: 'Rendering' },
    { name: 'Sprite Animation', level: 'advanced', note: 'Original art' },
    { name: 'Physics Systems', level: 'intermediate', note: 'Platforming, vehicles' },
  ],
  'AI & ML': [
    { name: 'PyTorch', level: 'intermediate', note: 'Model training' },
    { name: 'Transformers', level: 'intermediate', note: 'LLM fine-tuning' },
    { name: 'DSPy', level: 'intermediate', note: 'Prompt optimization' },
  ],
}
