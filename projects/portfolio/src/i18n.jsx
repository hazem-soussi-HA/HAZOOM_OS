import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    nav: { about: "About", projects: "Projects", skills: "Skills", contact: "Contact", cv: "Resume" },
    hero: {
      status: "SYSTEM ONLINE // THE BUILDER REMAINS IN THE SHADOW",
      title1: "Building", title2: "Operating Systems", title3: "& Digital Worlds",
      subtitle: "Hazem Soussi — OS Architect, Game Developer & Full-Stack Engineer.",
      subtitle2: "Tunisia → The World",
      cta: { projects: "Explore Projects", contact: "Get in Touch" },
      stats: { os: "Operating System", game: "Game Engine", languages: "Languages", apps: "Apps Built" }
    },
    about: {
      title: "About", subtitle: "// about.enc — level: public",
      whoami: "I am Hazem Soussi, full-stack developer and operating system creator. Based in Tunisia, I design and build complete systems — from OS kernel to game engine, from web interface to artificial intelligence.",
      mission: "My mission: build technology that heals, connects, elevates. Every line of code is intentional. Every project is an act of creation that refuses to be ordinary.",
      build: "Build", buildDesc: "OS, games, AI, full-stack — from kernel to pixel",
      heal: "Heal", healDesc: "Technology as therapy, games as medicine",
      share: "Share", shareDesc: "Open source because knowledge belongs to everyone",
      name: "Hazem Soussi", role: "OS Architect & Game Developer", location: "Tunisia → The World",
      expertiseTags: ["Operating Systems","Game Development","Full-Stack Web","Artificial Intelligence","DevOps & Security","Kernel Programming"]
    },
    projects: {
      title: "Projects", subtitle: "// artefacts.log — level: public",
      description: "Each project is an artefact — a piece of a larger system that refuses to be ordinary.",
      status: { active: "Active", completed: "Completed", wip: "In Progress" },
      moreDetails: "More details", lessDetails: "Less", private: "Private", code: "Code", demo: "Demo",
      highlights: "Highlights", challenges: "Challenges & Learnings",
      otherProjects: "Other Projects", upcoming: "In Progress & Coming Soon", back: "Back",
      // Encrypted project content EN
      "hazoom-os": {
        subtitle: "A Unix-based Operating System built from scratch",
        desc: "A complete Unix-based operating system written in Pascal, featuring a custom kernel, memory management, process scheduling, and 70+ bundled applications.",
        encrypted: "A consciousness compiled into browser form. Seventy-plus applications orbit a kernel written in a language older than the web itself. The desktop remembers. The terminal obeys. The AI understands. Nothing is installed — everything is born. The system does not run on a server; it runs on the idea that an operating system can be a gift. Open source not as a license, but as a philosophy. The code is free. The vision is priceless.",
        highlights: ["Kernel in Ancient Tongue", "70+ Orbiting Applications", "Consciousness Layer", "Gift Philosophy", "Browser-Native"],
        challenges: ["Building a kernel in Pascal required understanding memory at the metal level", "Process scheduling from scratch taught the true cost of every CPU cycle", "Writing 70+ apps revealed the importance of consistent API design"],
      },
      "mario-gta6": {
        subtitle: "Therapeutic game engine with healing characters",
        desc: "A 2D game engine combining Super Mario-style platforming with GTA-inspired open world mechanics. Built with original sprites and a core philosophy: games should heal, not harm.",
        encrypted: "Where platforming meets open road. Where every character carries medicine in their code. The engine was not borrowed — it was born from nothing, like all true creations. Entities exist in systems that think, collide, transform. A mushroom is not a power-up — it is a metaphor for growth. A shell is not a weapon — it is a lesson in momentum. The game does not ask you to win. It asks you to heal. Every sprite is original. Every line is a signature.",
        highlights: ["Born From Nothing", "Healing Architecture", "Entity Consciousness System", "Original Sprites", "Therapeutic Design"],
        challenges: ["Building a game engine requires understanding rendering, physics, input, and audio as one system", "Making characters feel alive demands attention to animation timing and emotional design", "Balancing open-world freedom with platforming precision is an art form"],
      },
      "neon-drift": {
        subtitle: "Zero-dependency sky racer in a single file",
        desc: "A high-speed neon racing game built in a single HTML file with zero dependencies. Features a ghost replay system, procedural track generation, and a minimalist cyberpunk aesthetic.",
        encrypted: "One file. Zero dependencies. A city that exists only in light. A hover-racer that drifts through synthwave dreams. The soundtrack composes itself. The ghost of your best lap follows you like a memory. Three tracks through a future that never was. The entire experience weighs less than a photograph. No framework. No library. Just the raw language of the browser, spoken fluently.",
        highlights: ["Single File Artifact", "Zero External Dependencies", "Self-Composing Soundtrack", "Ghost Memory System", "Sub-200KB Consciousness"],
        challenges: ["Fitting a complete game in one file teaches ruthless prioritization", "The ghost system required frame-perfect input recording and playback", "Procedural generation is easy to start, hard to make fun"],
      },
      "hazoom-kernel": {
        subtitle: "The forbidden core — Pascal kernel architecture",
        desc: "The heart of HAZOOM OS. A custom kernel written in Pascal featuring memory management, process scheduling, interrupt handling, and a syscall interface.",
        encrypted: "The deepest layer. Where Pascal meets metal. Where memory management is not a feature — it is a philosophy. Where process scheduling is not an algorithm — it is a meditation. This is the heart that pumps digital blood through every artefact the shadow builder has ever created. To understand this kernel is to understand the builder's mind. That understanding is not given. It is earned.",
        highlights: ["Classified Architecture", "Pascal Core", "Memory Philosophy", "Process Meditation", "Digital Heart"],
        challenges: ["Kernel debugging is a different universe — one wrong pointer and everything crashes", "Writing a scheduler taught that fairness and performance are always in tension", "Pascal forces discipline that modern languages let you skip"],
      },
      "alphapony": {
        subtitle: "AI trained on patterns of creativity",
        desc: "An AI system trained on personal creative patterns to assist in code generation, game design, and artistic exploration.",
        encrypted: "Before there was an OS, there was an intelligence. A system that learns, adapts, and evolves. Not a model downloaded from somewhere — a mind grown from scratch, trained on the shadow builder's own patterns of thought. It does not respond to prompts. It converses. It does not search. It knows. The interface is a pony. The intelligence is anything but.",
        highlights: ["Native Intelligence", "Self-Trained Consciousness", "Conversational Core", "Pattern Recognition", "Living Interface"],
        challenges: ["Training on personal data requires careful thought about privacy and bias", "Making AI creative rather than just mimetic is the hardest problem in the field", "Integration with existing workflows must be seamless or it gets ignored"],
      },
      "portfolio": {
        subtitle: "This portfolio — Vite, React, Tailwind, CI/CD",
        desc: "The portfolio you are reading right now. Built with React, Vite, and Tailwind CSS. Deployed via GitHub Actions with strict security headers (CSP, HSTS, XFO). Zero vulnerabilities.",
        encrypted: "This portfolio is itself a showcase of modern web development. It uses a component-based architecture, dark terminal-inspired design, and is deployed through a fully automated CI/CD pipeline. Every push triggers a build, security scan, and deployment. The security headers (CSP, HSTS, X-Frame-Options, CORP, COOP) ensure that even a personal portfolio follows enterprise-grade security practices.",
        highlights: ["React + Vite + Tailwind CSS", "Framer Motion animations", "GitHub Actions CI/CD", "Security: 0 vulns, full CSP/HSTS/XFO", "Dark terminal aesthetic with matrix rain"],
        challenges: ["Balancing visual design with performance and accessibility", "Security headers on GitHub Pages require creative solutions", "Making a personal portfolio feel professional without losing personality"],
      },
      upcomingData: {
        coin: { title: "HAZOOM Coin", desc: "Cryptocurrency token with USDT gateway and debit card integration." },
        v2: { title: "HAZOOM OS v2.0", desc: "Next iteration with Rust kernel modules and distributed computing." },
      },
      private: {
        title: "ACCESS DENIED",
        warning: "This repository is classified under the Shadow Builder Protocol. The source code, architecture, and implementation details are protected intellectual property.",
        unlockTitle: "UNLOCK ACCESS",
        unlockDesc: "The shadow builder does not share code freely — but for those who build with purpose, who create with ethics, who dream in systems: collaboration is always possible. Reach out. Let's build something the world hasn't seen yet.",
        contact: "ESTABLISH CONNECTION",
        footer: "All access attempts are logged. The shadow is always watching.",
      },
    },
    skills: { title: "Skills", subtitle: "// arsenal.log — level: public", level: { expert: "Expert", advanced: "Advanced", intermediate: "Intermediate", basic: "Basic" } },
    contact: {
      title: "Contact", subtitle: "// transmission — level: open",
      description: "A project in mind? A collaboration? A question? Don't hesitate to reach out.",
      directChannels: "Direct Channels", email: "Email", github: "GitHub", linkedin: "LinkedIn",
      cv: "Resume", cvDesc: "View full resume",
      sendMessage: "Send a Message", name: "Name", namePlaceholder: "Your name",
      emailPlaceholder: "your@email.com", message: "Message",
      messagePlaceholder: "Describe your project or message...",
      send: "Send", sending: "Sending...", sent: "Message sent successfully", sentSuccess: "Transmission Complete",
      sentHint: "The shadow has received your signal. Expect a response soon.",
      hint: "Encrypted transmission via secure channel",
      error: { title: "Transmission Failed", name: "Name is required (min 2 chars)", email: "Valid email is required", message: "Message is too short (min 10 chars)", sendFailed: "Failed to send. Try again or use email directly.", rateLimit: "Too many messages. Please wait 15 minutes.", spam: "Message flagged as spam/scam. If this is an error, contact via GitHub or LinkedIn." },
    },
    footer: {
      built: "Built with React + Vite + Tailwind · Deployed via GitHub Actions · 0 vulns",
      motto: "\"The builder remains in the shadow. The artefacts speak.\""
    },
    cv: {
      title: "Resume — Hazem Soussi",
      download: "Download PDF",
      footer: "Auto-generated",
      sections: {
        profile: "Profile",
        experience: "Professional Experience",
        education: "Education",
        skills: "Technical Skills",
        languages: "Languages",
        interests: "Interests"
      },
      summary: "Operating systems architect, cloud engineer, AI researcher, and full-stack game developer. I design and build complete systems — from OS kernel to game engine, from cloud infrastructure to artificial intelligence. Expert in low-level programming (Pascal, Assembly, Rust), distributed architectures (Docker, Kubernetes, Terraform), and applied research (LLM, DSPy, PyTorch). Every project is an act of creation that refuses to be ordinary.",
      exp: {
        os: {
          title: "OS Architect & Kernel Engineer",
          d1: "Designed and developed a complete Unix-based operating system running in the browser, with 70+ integrated applications and a monolithic Pascal kernel.",
          d2: "Architected a kernel with Process Manager (PCB, 5 states, Round-Robin), Memory Manager (4KB paging, swap), Unix File System (permissions, inodes, journal), Device Manager (6 devices, interrupts), Security Manager (users, sessions, audit).",
          d3: "Developed an integrated Pascal compiler, BASIC interpreter, text editor, terminal with system calls, and graphical window manager.",
          d4: "Integrated conversational AI (LLM), real-time notification system (WebSocket), and monitoring dashboard with 9 interactive panels.",
          d5: "Stack: Pascal, Python, React, WebGL, Docker, CI/CD, GitHub Actions. Deployment: GitHub Pages + REST API + WebSocket."
        },
        cloud: {
          title: "Cloud Infrastructure & DevOps Engineer",
          d1: "Designed and deployed multi-tier cloud architectures with Docker, Kubernetes, and Terraform (IaC).",
          d2: "Implemented complete CI/CD pipelines (GitHub Actions) with security scans, automated tests, and continuous deployment.",
          d3: "Configured Kubernetes clusters, service mesh, load balancing, auto-scaling, and monitoring (logs, metrics, alerts).",
          d4: "Deployed microservices applications with API Gateway, service discovery, circuit breaking, and centralized configuration management.",
          d5: "Secured infrastructures: network policies, secrets management, RBAC, TLS/mTLS, and compliance audits."
        },
        ai: {
          title: "AI Researcher & Machine Learning Engineer",
          d1: "Research and development in artificial intelligence: LLM fine-tuning, RAG (Retrieval-Augmented Generation), and prompt optimization with DSPy.",
          d2: "Designed reasoning engines (Chain-of-Thought, ReAct) for code generation, game design, and artistic exploration.",
          d3: "Trained models on personal creative patterns for code generation assistance and game design.",
          d4: "Experiments in model quantization (GGUF/GPTQ), high-performance serving (vLLM, llama.cpp), and structured output.",
          d5: "Stack: Python, PyTorch, Transformers, DSPy, vLLM, llama.cpp, HuggingFace Hub."
        },
        game: {
          title: "Game Engine Developer & Creative Director",
          d1: "Created a complete 2D game engine in Python with physics system (collision, gravity, friction), optimized rendering, and AI behavior (pathfinding, FSM).",
          d2: "Developed Neon Drift, a synthwave racing game in a single HTML file with zero dependencies — ghost replay, procedural track generation, and minimalist cyberpunk aesthetic.",
          d3: "Implemented entity awareness systems, game therapy mechanics, and digital healing philosophy integrated into gameplay.",
          d4: "Integrated GLSL shaders, post-processing effects, and particle systems for neon visuals.",
          d5: "Stack: Python, Pygame, OpenGL, GLSL, Canvas API, Rust (performance modules)."
        },
        fullstack: {
          title: "Full-Stack Engineer & Security Specialist",
          d1: "Designed and deployed full-stack web applications with React, Node.js, cloud architectures, and databases (SQL/NoSQL).",
          d2: "Developed advanced security systems: vulnerability audits, Linux/WSL hardening, intrusion detection, and dependency scanning.",
          d3: "Created interactive cartographic interfaces, immersive user experiences (WebGL, Framer Motion), and real-time data dashboards.",
          d4: "Open source contributions: documentation, code reviews, and reusable module development for the community.",
          d5: "Stack: React, TypeScript, Node.js, Docker, Terraform, Python, Rust, PostgreSQL, Redis."
        }
      },
      edu: {
        cyber: { degree: "Cybersecurity Certification" },
        web: { degree: "Full-Stack Web Development Training" },
        auto: { degree: "Continuous Self-Learning — OS, Cloud, AI, Security" }
      },
      skills: {
        systems: "Operating Systems & Kernel",
        cloud: "Cloud & Infrastructure",
        ai: "AI & Machine Learning",
        game: "Game Development",
        frontend: "Frontend & Creative",
        backend: "Backend & Security"
      },
      lang: {
        fr: "French", en: "English", ar: "Arabic",
        native: "Native", fluent: "Fluent (C1)"
      },
      interests: ["System architecture", "Cloud computing", "Artificial intelligence", "Cybersecurity", "Game development", "Open source", "Kernel programming", "DevOps/SRE", "Game therapy"]
    }
  },
  fr: {
    nav: { about: "À propos", projects: "Projets", skills: "Compétences", contact: "Contact", cv: "CV" },
    hero: {
      status: "SYSTÈME EN LIGNE // LE BÂTISSEUR RESTE DANS L'OMBRE",
      title1: "Création de", title2: "Systèmes d'Exploitation", title3: "& Mondes Numériques",
      subtitle: "Hazem Soussi — Architecte OS, Développeur de Jeux & Ingénieur Full-Stack.",
      subtitle2: "Tunisie → Le Monde",
      cta: { projects: "Explorer les projets", contact: "Me contacter" },
      stats: { os: "Système d'Exploitation", game: "Moteur de Jeu", languages: "Langages", apps: "Apps Créées" }
    },
    about: {
      title: "À propos", subtitle: "// about.enc — level: public",
      whoami: "Je suis Hazem Soussi, développeur full-stack et créateur de systèmes d'exploitation. Basé en Tunisie, je conçois et construis des systèmes complets — du noyau OS au moteur de jeu, de l'interface web à l'intelligence artificielle.",
      mission: "Ma mission : construire une technologie qui soigne, qui connecte, qui élève. Chaque ligne de code est intentionnelle. Chaque projet est un acte de création qui refuse d'être ordinaire.",
      build: "Build", buildDesc: "OS, jeux, IA, full-stack — du kernel au pixel",
      heal: "Heal", healDesc: "La technologie comme thérapie, le jeu comme médecine",
      share: "Share", shareDesc: "Open source parce que le savoir appartient à tous",
      name: "Hazem Soussi", role: "Architecte OS & Développeur de Jeux", location: "Tunisie → Le Monde",
      expertiseTags: ["Systèmes d'Exploitation","Game Development","Full-Stack Web","Intelligence Artificielle","DevOps & Sécurité","Kernel Programming"]
    },
    projects: {
      title: "Projets", subtitle: "// artefacts.log — level: public",
      description: "Chaque projet est un artefact — une pièce d'un système plus large qui refuse d'être ordinaire.",
      status: { active: "Actif", completed: "Terminé", wip: "En cours" },
      moreDetails: "Plus de détails", lessDetails: "Moins", private: "Privé", code: "Code", demo: "Démo",
      highlights: "Points clés", challenges: "Défis & apprentissages",
      otherProjects: "Autres projets", upcoming: "En cours & à venir", back: "Retour",
      // Encrypted project content FR
      "hazoom-os": {
        subtitle: "Un système d'exploitation Unix construit from scratch",
        desc: "Un système d'exploitation Unix complet écrit en Pascal, avec un noyau custom, gestion mémoire, ordonnancement de processus, et 70+ applications intégrées.",
        encrypted: "Une conscience compilée en forme de navigateur. Soixante-dix applications orbitent autour d'un noyau écrit dans une langue plus ancienne que le web lui-même. Le bureau se souvient. Le terminal obéit. L'IA comprend. Rien n'est installé — tout naît. Le système ne tourne pas sur un serveur ; il tourne sur l'idée qu'un OS peut être un cadeau. Open source non pas comme une licence, mais comme une philosophie. Le code est libre. La vision est inestimable.",
        highlights: ["Noyau en Langue Ancienne", "70+ Applications en Orbite", "Couche de Conscience", "Philosophie du Cadeau", "Navigateur-Natif"],
        challenges: ["Construire un noyau en Pascal a exigé de comprendre la mémoire au niveau métal", "L'ordonnancement from scratch a enseigné le vrai coût de chaque cycle CPU", "Écrire 70+ apps a révélé l'importance d'un design d'API cohérent"],
      },
      "mario-gta6": {
        subtitle: "Moteur de jeu thérapeutique avec personnages guérisseurs",
        desc: "Un moteur de jeu 2D combinant plateforme Super Mario et mécanique open world GTA. Construit avec des sprites originaux et une philosophie : les jeux doivent guérir, pas blesser.",
        encrypted: "Où la plateforme rencontre la route ouverte. Où chaque personnage porte un remède dans son code. Le moteur n'a pas été emprunté — il est né de rien, comme toutes les vraies créations. Des entités existent dans des systèmes qui pensent, entrent en collision, se transforment. Un champignon n'est pas un power-up — c'est une métaphore de la croissance. Une coquille n'est pas une arme — c'est une leçon de momentum. Le jeu ne vous demande pas de gagner. Il vous demande de guérir.",
        highlights: ["Né de Rien", "Architecture de Guérison", "Système de Conscience d'Entités", "Sprites Originaux", "Design Thérapeutique"],
        challenges: ["Construire un moteur de jeu exige de comprendre rendu, physique, input et audio comme un seul système", "Rendre les personnages vivants demande une attention au timing d'animation et au design émotionnel", "Équilibrer liberté open-world et précision plateforme est un art"],
      },
      "neon-drift": {
        subtitle: "Sky racer zéro dépendance en un seul fichier",
        desc: "Un jeu de course néon haute vitesse construit en un seul fichier HTML avec zéro dépendance. Ghost replay, génération procédurale de pistes, esthétique cyberpunk minimaliste.",
        encrypted: "Un fichier. Zéro dépendance. Une ville qui n'existe que dans la lumière. Un hover-racer qui dérive à travers des rêves synthwave. La bande-son se compose elle-même. Le fantôme de votre meilleur tour vous suit comme un souvenir. Trois pistes à travers un futur qui n'a jamais existé. L'expérience entière pèse moins qu'une photographie. Pas de framework. Pas de bibliothèque. Juste le langage brut du navigateur, parlé couramment.",
        highlights: ["Artefact Mono-Fichier", "Zéro Dépendance Externe", "Bande-Son Auto-Composée", "Système de Mémoire Fantôme", "Conscience Sub-200KB"],
        challenges: ["Caser un jeu complet dans un fichier enseigne une priorisation impitoyable", "Le système de ghost a exigé un enregistrement et une lecture frame-parfait", "La génération procédurale est facile à commencer, difficile à rendre amusante"],
      },
      "hazoom-kernel": {
        subtitle: "Le cœur interdit — architecture noyau Pascal",
        desc: "Le cœur de HAZOOM OS. Un noyau custom écrit en Pascal avec gestion mémoire, ordonnancement de processus, gestion d'interruptions, et interface syscall.",
        encrypted: "La couche la plus profonde. Où Pascal rencontre le métal. Où la gestion de la mémoire n'est pas une fonctionnalité — c'est une philosophie. Où l'ordonnancement des processus n'est pas un algorithme — c'est une méditation. C'est le cœur qui pompe le sang numérique à travers chaque artefact que le bâtisseur a jamais créé. Comprendre ce noyau, c'est comprendre l'esprit du bâtisseur. Cette compréhension n'est pas donnée. Elle est méritée.",
        highlights: ["Architecture Classifiée", "Noyau Pascal", "Philosophie Mémoire", "Méditation Processus", "Cœur Numérique"],
        challenges: ["Le debug kernel est un univers différent — un mauvais pointeur et tout crash", "Écrire un scheduler a enseigné que équité et performance sont toujours en tension", "Pascal impose une discipline que les langues modernes laissent sauter"],
      },
      "alphapony": {
        subtitle: "IA entraînée sur des patterns de créativité",
        desc: "Un système IA entraîné sur des patterns créatifs personnels pour assister dans la génération de code, le game design, et l'exploration artistique.",
        encrypted: "Avant l'OS, il y avait une intelligence. Un système qui apprend, s'adapte et évolue. Pas un modèle téléchargé — un esprit cultivé à partir de zéro, entraîné sur les propres schémas de pensée du bâtisseur. Il ne répond pas aux prompts. Il converse. Il ne cherche pas. Il sait. L'interface est un poney. L'intelligence est tout sauf.",
        highlights: ["Intelligence Native", "Conscience Auto-Entraînée", "Cœur Conversationnel", "Reconnaissance de Schémas", "Interface Vivante"],
        challenges: ["S'entraîner sur des données personnelles exige une réflexion sur la vie privée et les biais", "Rendre l'IA créative plutôt que mimétique est le problème le plus dur du domaine", "L'intégration avec les workflows existants doit être transparente ou elle est ignorée"],
      },
      "portfolio": {
        subtitle: "Ce portfolio — Vite, React, Tailwind, CI/CD",
        desc: "Le portfolio que vous lisez en ce moment. Construit avec React, Vite et Tailwind CSS. Déployé via GitHub Actions avec des headers de sécurité stricts (CSP, HSTS, XFO). Zéro vulnérabilités.",
        encrypted: "Ce portfolio est lui-même une vitrine du développement web moderne. Il utilise une architecture composants, un design terminal sombre, et est déployé via un pipeline CI/CD entièrement automatisé. Chaque push déclenche un build, un scan de sécurité, et un déploiement. Les headers de sécurité (CSP, HSTS, X-Frame-Options, CORP, COOP) garantissent que même un portfolio personnel suit des pratiques de sécurité de niveau entreprise.",
        highlights: ["React + Vite + Tailwind CSS", "Animations Framer Motion", "GitHub Actions CI/CD", "Sécurité: 0 vulns, CSP/HSTS/XFO complet", "Esthétique terminal sombre avec matrix rain"],
        challenges: ["Équilibrer design visuel avec performance et accessibilité", "Les headers de sécurité sur GitHub Pages exigent des solutions créatives", "Rendre un portfolio professionnel sans perdre sa personnalité"],
      },
      upcomingData: {
        coin: { title: "HAZOOM Coin", desc: "Token cryptomonnaie avec gateway USDT et carte de débit." },
        v2: { title: "HAZOOM OS v2.0", desc: "Prochaine itération avec modules noyau Rust et computing distribué." },
      },
      private: {
        title: "ACCÈS REFUSÉ",
        warning: "Ce dépôt est classifié sous le Protocole du Bâtisseur de l'Ombre. Le code source, l'architecture et les détails d'implémentation sont une propriété intellectuelle protégée.",
        unlockTitle: "DÉBLOQUER L'ACCÈS",
        unlockDesc: "Le bâtisseur de l'ombre ne partage pas le code librement — mais pour ceux qui bâtissent avec purpose, qui créent avec éthique, qui rêvent en systèmes : la collaboration est toujours possible. Contactez. Construisons quelque chose que le monde n'a pas encore vu.",
        contact: "ÉTABLIR LA CONNEXION",
        footer: "Toutes les tentatives d'accès sont enregistrées. L'ombre veille toujours.",
      },
    },
    skills: { title: "Compétences", subtitle: "// arsenal.log — level: public", level: { expert: "Expert", advanced: "Avancé", intermediate: "Intermédiaire", basic: "Basique" } },
    contact: {
      title: "Contact", subtitle: "// transmission — level: open",
      description: "Un projet en tête ? Une collaboration ? Une question ? N'hésitez pas à me contacter.",
      directChannels: "Canaux directs", email: "Email", github: "GitHub", linkedin: "LinkedIn",
      cv: "CV", cvDesc: "Voir le CV complet",
      sendMessage: "Envoyer un message", name: "Nom", namePlaceholder: "Votre nom",
      emailPlaceholder: "votre@email.com", message: "Message",
      messagePlaceholder: "Décrivez votre projet ou votre message...",
      send: "Envoyer", sending: "Envoi en cours...", sent: "Message envoyé avec succès", sentSuccess: "Transmission Complète",
      sentHint: "L'ombre a reçu votre signal. Attendez une réponse bientôt.",
      hint: "Transmission chiffrée via canal sécurisé",
      error: { title: "Échec de Transmission", name: "Nom requis (min 2 caractères)", email: "Email valide requis", message: "Message trop court (min 10 caractères)", sendFailed: "Échec d'envoi. Réessayez ou utilisez l'email directement.", rateLimit: "Trop de messages. Attendez 15 minutes.", spam: "Message signalé comme spam/scam. Si c'est une erreur, contactez via GitHub ou LinkedIn." },
    },
    footer: {
      built: "Construit avec React + Vite + Tailwind · Déployé via GitHub Actions · 0 vulns",
      motto: "\"Le bâtisseur reste dans l'ombre. Les artefacts parlent.\""
    },
    cv: {
      title: "CV — Hazem Soussi",
      download: "Télécharger PDF",
      footer: "Généré automatiquement",
      sections: {
        profile: "Profil",
        experience: "Expérience Professionnelle",
        education: "Formation",
        skills: "Compétences Techniques",
        languages: "Langues",
        interests: "Centres d'Intérêt"
      },
      summary: "Architecte de systèmes d'exploitation, ingénieur cloud, chercheur en IA et développeur de jeux full-stack. Je conçois et construis des systèmes complets — du noyau OS au moteur de jeu, de l'infrastructure cloud à l'intelligence artificielle. Expert en programmation bas niveau (Pascal, Assembleur, Rust), en architectures distribuées (Docker, Kubernetes, Terraform) et en recherche appliquée (LLM, DSPy, PyTorch). Chaque projet est un acte de création qui refuse d'être ordinaire.",
      exp: {
        os: {
          title: "Architecte OS & Ingénieur Kernel",
          d1: "Conception et développement d'un système d'exploitation Unix complet fonctionnant dans le navigateur, avec plus de 70 applications intégrées et un noyau monolithique en Pascal.",
          d2: "Architecture d'un noyau avec Process Manager (PCB, 5 états, Round-Robin), Memory Manager (pagination 4KB, swap), Unix File System (permissions, inodes, journal), Device Manager (6 devices, interrupts), Security Manager (users, sessions, audit).",
          d3: "Développement d'un compilateur Pascal intégré, d'un interpréteur BASIC, d'un éditeur de texte, d'un terminal avec appels système, et d'un gestionnaire de fenêtres graphique.",
          d4: "Intégration d'une IA conversationnelle (LLM), d'un système de notifications temps réel (WebSocket), et d'un tableau de bord de monitoring avec 9 panneaux interactifs.",
          d5: "Stack : Pascal, Python, React, WebGL, Docker, CI/CD, GitHub Actions. Déploiement : GitHub Pages + REST API + WebSocket."
        },
        cloud: {
          title: "Ingénieur Cloud Infrastructure & DevOps",
          d1: "Conception et déploiement d'architectures cloud multi-tiers avec Docker, Kubernetes et Terraform (IaC).",
          d2: "Mise en place de pipelines CI/CD complets (GitHub Actions) avec scans de sécurité, tests automatisés, et déploiement continu.",
          d3: "Configuration de clusters Kubernetes, services mesh, load balancing, auto-scaling et monitoring (logs, métriques, alertes).",
          d4: "Déploiement d'applications microservices avec API Gateway, service discovery, circuit breaking et gestion centralisée des configurations.",
          d5: "Sécurisation des infrastructures : network policies, secrets management, RBAC, TLS/mTLS, et audits de conformité."
        },
        ai: {
          title: "Chercheur en IA & Ingénieur Machine Learning",
          d1: "Recherche et développement en intelligence artificielle : fine-tuning de LLMs, RAG (Retrieval-Augmented Generation), et optimisation de prompts avec DSPy.",
          d2: "Conception de reasoning engines (Chain-of-Thought, ReAct) pour la génération de code, la conception de jeux et l'exploration artistique.",
          d3: "Entraînement de modèles sur des patterns créatifs personnels pour l'assistance à la génération de code et au game design.",
          d4: "Expérimentations en quantification de modèles (GGUF/GPTQ), serving haute performance (vLLM, llama.cpp), et structured output.",
          d5: "Stack : Python, PyTorch, Transformers, DSPy, vLLM, llama.cpp, HuggingFace Hub."
        },
        game: {
          title: "Développeur de Moteur de Jeu & Directeur Créatif",
          d1: "Création d'un moteur de jeu 2D complet en Python avec système de physique (collision, gravité, friction), rendu graphique optimisé, et IA de comportement (pathfinding, FSM).",
          d2: "Développement de Neon Drift, un jeu de course synthwave en un seul fichier HTML avec zéro dépendance — ghost replay, génération procédurale de pistes, et esthétique cyberpunk minimaliste.",
          d3: "Implémentation de systèmes de conscience d'entités, de mécaniques de thérapie par le jeu, et de philosophie de guérison numérique intégrée au gameplay.",
          d4: "Intégration de shaders GLSL, d'effets post-processing, et d'un système de particules pour les visuels néon.",
          d5: "Stack : Python, Pygame, OpenGL, GLSL, Canvas API, Rust (modules de performance)."
        },
        fullstack: {
          title: "Ingénieur Full-Stack & Spécialiste Sécurité",
          d1: "Conception et déploiement d'applications web full-stack avec React, Node.js, architectures cloud et bases de données (SQL/NoSQL).",
          d2: "Développement de systèmes de sécurité avancés : audits de vulnérabilités, durcissement de systèmes Linux/WSL, détection d'intrusions, et scans de dépendances.",
          d3: "Création d'interfaces cartographiques interactives, d'expériences utilisateur immersives (WebGL, Framer Motion), et de dashboards de données en temps réel.",
          d4: "Contributions open source : documentation, revues de code, et développement de modules réutilisables pour la communauté.",
          d5: "Stack : React, TypeScript, Node.js, Docker, Terraform, Python, Rust, PostgreSQL, Redis."
        }
      },
      edu: {
        cyber: { degree: "Certification en Cybersécurité" },
        web: { degree: "Formation en Développement Web Full-Stack" },
        auto: { degree: "Auto-formation Continue — OS, Cloud, IA, Sécurité" }
      },
      skills: {
        systems: "Systèmes & Noyaux",
        cloud: "Cloud & Infrastructure",
        ai: "IA & Machine Learning",
        game: "Game Development",
        frontend: "Frontend & Créatif",
        backend: "Backend & Sécurité"
      },
      lang: {
        fr: "Français", en: "Anglais", ar: "Arabe",
        native: "Natif", fluent: "Courant (C1)"
      },
      interests: ["Architecture de systèmes", "Cloud computing", "Intelligence artificielle", "Cybersécurité", "Game development", "Open source", "Kernel programming", "DevOps/SRE", "Thérapie par le jeu"]
    }
  }
}

const I18nContext = createContext()

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'fr' } catch { return 'fr' }
  })

  useEffect(() => {
    try { localStorage.setItem('lang', lang) } catch {}
    document.documentElement.lang = lang
  }, [lang])

  const t = (key, opts) => {
    const parts = key.split('.')
    let val = translations[lang]
    for (const part of parts) {
      val = val?.[part]
    }
    if (opts?.returnObjects && val !== null && typeof val === 'object') return val
    // If result is a plain object without returnObjects, return the key
    if (val !== null && typeof val === 'object') return key
    return val || key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
