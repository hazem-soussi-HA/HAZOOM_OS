import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Github, Linkedin, Send, CheckCircle, FileText, Download } from 'lucide-react'
import { useI18n } from '../i18n'

function generateCVHTML(lang) {
  const isFR = lang === 'fr'
  const t = (key) => {
    const parts = key.split('.')
    const translations = isFR
      ? {
          cv: {
            title: 'CV — Hazem Soussi',
            summary: 'Architecte de systèmes d\'exploitation, ingénieur cloud, chercheur en IA et développeur de jeux full-stack. Je conçois et construis des systèmes complets — du noyau OS au moteur de jeu, de l\'infrastructure cloud à l\'intelligence artificielle.',
            exp: [
              { title: 'Architecte OS & Ingénieur Kernel', items: ['Conception et développement d\'un système d\'exploitation Unix complet avec 70+ applications et noyau Pascal', 'Architecture kernel : Process Manager, Memory Manager, File System, Device Manager, Security Manager', 'Développement : compilateur Pascal, interpréteur BASIC, terminal, gestionnaire fenêtres', 'Intégration IA conversationnelle, WebSocket temps réel, monitoring dashboard'] },
              { title: 'Ingénieur Cloud & DevOps', items: ['Architectures cloud multi-tiers (Docker, Kubernetes, Terraform)', 'Pipelines CI/CD (GitHub Actions) avec scans sécurité', 'Clusters Kubernetes, service mesh, auto-scaling', 'Microservices, API Gateway, RBAC, TLS'] },
              { title: 'Chercheur IA & ML', items: ['Fine-tuning LLM, RAG, DSPy', 'Reasoning engines (CoT, ReAct)', 'Entraînement modèles patterns créatifs', 'Quantification GGUF/GPTQ, vLLM'] },
              { title: 'Développeur Moteur de Jeu', items: ['Moteur 2D complet (physique, rendu, IA)', 'Neon Drift : jeu course HTML single-file', 'Systèmes de conscience d\'entités', 'Shaders GLSL, post-processing'] },
              { title: 'Ingénieur Full-Stack & Sécurité', items: ['Apps web React/Node.js, cloud SQL/NoSQL', 'Sécurité : audits, hardening, détection intrusion', 'Cartographie interactive, WebGL, dashboards', 'Contributions open source'] },
            ],
            edu: ['Certification Cybersécurité', 'Formation Full-Stack Web', 'Auto-formation : OS, Cloud, IA, Sécurité'],
            skills: [{ cat: 'OS & Noyaux', items: 'Pascal, Rust, C, Assembly' }, { cat: 'Cloud & Infra', items: 'Docker, Kubernetes, Terraform, GitHub Actions' }, { cat: 'IA & ML', items: 'PyTorch, Transformers, DSPy, vLLM' }, { cat: 'Game Dev', items: 'Python, OpenGL, GLSL, Canvas API' }, { cat: 'Frontend', items: 'React, TypeScript, Tailwind, WebGL' }, { cat: 'Backend & Sécurité', items: 'Node.js, PostgreSQL, Redis, CSP/HSTS' }],
            lang: [{ name: 'Français', level: 'Natif' }, { name: 'Anglais', level: 'Courant (C1)' }, { name: 'Arabe', level: 'Natif' }],
            interests: ['Architecture systèmes', 'Cloud computing', 'IA', 'Cybersécurité', 'Game development', 'Open source', 'Kernel', 'DevOps/SRE'],
          },
        }
      : {
          cv: {
            title: 'Resume — Hazem Soussi',
            summary: 'Operating systems architect, cloud engineer, AI researcher, and full-stack game developer. I design and build complete systems — from OS kernel to game engine, from cloud infrastructure to artificial intelligence.',
            exp: [
              { title: 'OS Architect & Kernel Engineer', items: ['Designed complete Unix-based OS with 70+ apps and Pascal kernel', 'Kernel architecture: Process Manager, Memory Manager, File System, Device Manager, Security Manager', 'Built Pascal compiler, BASIC interpreter, terminal, window manager', 'Integrated conversational AI, WebSocket, monitoring dashboard'] },
              { title: 'Cloud Infrastructure & DevOps', items: ['Multi-tier cloud architectures (Docker, Kubernetes, Terraform)', 'CI/CD pipelines (GitHub Actions) with security scans', 'Kubernetes clusters, service mesh, auto-scaling', 'Microservices, API Gateway, RBAC, TLS'] },
              { title: 'AI Researcher & ML Engineer', items: ['LLM fine-tuning, RAG, DSPy prompt optimization', 'Reasoning engines (CoT, ReAct)', 'Model training on creative patterns', 'GGUF/GPTQ quantization, vLLM deployment'] },
              { title: 'Game Engine Developer', items: ['Complete 2D game engine (physics, rendering, AI)', 'Neon Drift: single-file HTML racing game', 'Entity consciousness systems', 'GLSL shaders, post-processing effects'] },
              { title: 'Full-Stack & Security Engineer', items: ['React/Node.js web apps, cloud SQL/NoSQL', 'Security: audits, hardening, intrusion detection', 'Interactive mapping, WebGL, real-time dashboards', 'Open source contributions'] },
            ],
            edu: ['Cybersecurity Certification', 'Full-Stack Web Development Training', 'Self-Learning: OS, Cloud, AI, Security'],
            skills: [{ cat: 'OS & Systems', items: 'Pascal, Rust, C, Assembly' }, { cat: 'Cloud & Infra', items: 'Docker, Kubernetes, Terraform, GitHub Actions' }, { cat: 'AI & ML', items: 'PyTorch, Transformers, DSPy, vLLM' }, { cat: 'Game Dev', items: 'Python, OpenGL, GLSL, Canvas API' }, { cat: 'Frontend', items: 'React, TypeScript, Tailwind, WebGL' }, { cat: 'Backend & Security', items: 'Node.js, PostgreSQL, Redis, CSP/HSTS' }],
            lang: [{ name: 'French', level: 'Native' }, { name: 'English', level: 'Fluent (C1)' }, { name: 'Arabic', level: 'Native' }],
            interests: ['System architecture', 'Cloud computing', 'AI', 'Cybersecurity', 'Game development', 'Open source', 'Kernel', 'DevOps/SRE'],
          },
        }
    let val = translations
    for (const part of parts) {
      val = val?.[part]
    }
    return val || key
  }

  const expHTML = t('cv.exp').map((exp, i) => `
    <div style="margin-bottom: 16px;">
      <h3 style="color: #00d4ff; font-size: 14px; margin: 0 0 6px 0; font-family: 'JetBrains Mono', monospace;">${exp.title}</h3>
      <ul style="margin: 0; padding-left: 18px; color: #94a3b8; font-size: 12px; line-height: 1.6;">
        ${exp.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('')

  const skillsHTML = t('cv.skills').map(s => `
    <div style="margin-bottom: 8px;">
      <strong style="color: #00d4ff; font-size: 12px;">${s.cat}:</strong>
      <span style="color: #94a3b8; font-size: 12px;"> ${s.items}</span>
    </div>
  `).join('')

  const langHTML = t('cv.lang').map(l => `
    <div style="margin-bottom: 4px;">
      <span style="color: #e2e8f0; font-size: 12px;">${l.name}</span>
      <span style="color: #64748b; font-size: 11px;"> — ${l.level}</span>
    </div>
  `).join('')

  const interestsHTML = t('cv.interests').join(' · ')

  return `
<!DOCTYPE html>
<html lang="${isFR ? 'fr' : 'en'}">
<head>
  <meta charset="UTF-8">
  <title>${t('cv.title')}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #030712; color: #e2e8f0; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(0,212,255,0.2); }
    .header h1 { font-size: 28px; font-weight: 900; background: linear-gradient(135deg, #00d4ff, #7dd3fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .header .subtitle { color: #64748b; font-size: 13px; font-family: 'JetBrains Mono', monospace; margin-top: 4px; }
    .header .contact { color: #94a3b8; font-size: 11px; margin-top: 8px; }
    .section { margin-bottom: 24px; }
    .section-title { color: #f59e0b; font-size: 11px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
    .summary { color: #94a3b8; font-size: 13px; line-height: 1.7; }
    .edu-item { color: #94a3b8; font-size: 12px; margin-bottom: 4px; }
    .interests { color: #64748b; font-size: 11px; margin-top: 4px; }
    hr { border: none; border-top: 1px solid rgba(0,212,255,0.1); margin: 24px 0; }
    .footer { text-align: center; color: #475569; font-size: 10px; font-family: 'JetBrains Mono', monospace; margin-top: 32px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hazem Soussi</h1>
      <div class="subtitle">${isFR ? 'Architecte OS & Ingénieur Full-Stack' : 'OS Architect & Full-Stack Engineer'}</div>
      <div class="contact">hazem.soussi@gmail.com · github.com/hazem-soussi-HA · linkedin.com/in/hazem-soussi</div>
    </div>

    <div class="section">
      <div class="section-title">${isFR ? 'Profil' : 'Profile'}</div>
      <p class="summary">${t('cv.summary')}</p>
    </div>

    <hr>

    <div class="section">
      <div class="section-title">${isFR ? 'Expérience Professionnelle' : 'Professional Experience'}</div>
      ${expHTML}
    </div>

    <hr>

    <div class="section">
      <div class="section-title">${isFR ? 'Formation' : 'Education'}</div>
      ${t('cv.edu').map(e => `<div class="edu-item">▸ ${e}</div>`).join('')}
    </div>

    <hr>

    <div class="section">
      <div class="section-title">${isFR ? 'Compétences Techniques' : 'Technical Skills'}</div>
      ${skillsHTML}
    </div>

    <hr>

    <div class="section">
      <div class="section-title">${isFR ? 'Langues' : 'Languages'}</div>
      ${langHTML}
    </div>

    <hr>

    <div class="section">
      <div class="section-title">${isFR ? 'Centres d\'Intérêt' : 'Interests'}</div>
      <p class="interests">${interestsHTML}</p>
    </div>

    <div class="footer">${isFR ? 'Généré automatiquement depuis hazem-soussi.com' : 'Auto-generated from hazem-soussi.com'}</div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`
}

export default function ContactSection() {
  const { t, lang } = useI18n()
  const [formState, setFormState] = useState({ name: '', email: '', message: '', sent: false })

  const handleSubmit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Portfolio contact: ${formState.name}`)
    const body = encodeURIComponent(`From: ${formState.name} (${formState.email})\n\n${formState.message}`)
    window.location.href = `mailto:hazem.soussi@gmail.com?subject=${subject}&body=${body}`
    setFormState((prev) => ({ ...prev, sent: true }))
    setTimeout(() => setFormState((prev) => ({ ...prev, sent: false })), 4000)
  }

  const handleDownloadCV = () => {
    const html = generateCVHTML(lang)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Hazem_Soussi_CV_${lang === 'fr' ? 'FR' : 'EN'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleViewCV = () => {
    const html = generateCVHTML(lang)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  return (
    <section id="contact" className="py-20 sm:py-28 px-4 sm:px-6 relative" aria-label={t('contact.title')}>
      <div className="absolute top-0 left-0 right-0 section-divider" aria-hidden="true" />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-cyan/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-mono text-xs text-cyan uppercase tracking-widest mb-3">
            {t('contact.subtitle')}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-cyan">{t('contact.title')}</span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            {t('contact.description')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8 sm:gap-10">
          {/* Left: Social links */}
          <motion.div
            className="md:col-span-2 space-y-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-500 mb-6">
              {t('contact.directChannels')}
            </h3>

            {[
              {
                icon: Mail,
                label: t('contact.email'),
                value: 'hazem.soussi@gmail.com',
                href: 'mailto:hazem.soussi@gmail.com',
                color: 'cyan',
              },
              {
                icon: Github,
                label: t('contact.github'),
                value: 'hazem-soussi-HA',
                href: 'https://github.com/hazem-soussi-HA',
                color: 'matrix',
              },
              {
                icon: Linkedin,
                label: t('contact.linkedin'),
                value: 'Hazem Soussi',
                href: 'https://www.linkedin.com/in/hazem-soussi/',
                color: 'amber',
              },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('mailto') ? undefined : '_blank'}
                rel={item.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                className="glass glass-hover rounded-xl p-4 flex items-center gap-4 group transition-all"
                aria-label={item.label}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    item.color === 'cyan'
                      ? 'bg-cyan/10 text-cyan'
                      : item.color === 'matrix'
                      ? 'bg-matrix/10 text-matrix'
                      : 'bg-amber/10 text-amber'
                  }`}
                >
                  <item.icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">{item.label}</div>
                  <div className="text-sm text-slate-300 group-hover:text-white transition-colors truncate">
                    {item.value}
                  </div>
                </div>
              </a>
            ))}

            {/* CV / Resume */}
            <div className="glass rounded-xl p-4 glass-hover cursor-pointer" onClick={handleViewCV}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center shrink-0 text-cyan">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500">{t('contact.cv')}</div>
                  <div className="text-sm text-slate-300 group-hover:text-white transition-colors truncate">
                    {t('contact.cvDesc')}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadCV() }}
                  className="p-2 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 transition-all"
                  aria-label={t('cv.download')}
                  title={t('cv.download')}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right: Contact form */}
          <motion.div
            className="md:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-500 mb-2">
                {t('contact.sendMessage')}
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs text-slate-500 mb-1.5 font-mono">
                    {t('contact.name')}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20 transition-all"
                    placeholder={t('contact.namePlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs text-slate-500 mb-1.5 font-mono">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20 transition-all"
                    placeholder={t('contact.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs text-slate-500 mb-1.5 font-mono">
                  {t('contact.message')}
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState((p) => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20 transition-all resize-none"
                  placeholder={t('contact.messagePlaceholder')}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[10px] text-slate-600 font-mono">
                  {formState.sent ? (
                    <span className="text-matrix flex items-center gap-1.5">
                      <CheckCircle size={12} /> {t('contact.sent')}
                    </span>
                  ) : (
                    t('contact.hint')
                  )}
                </p>
                <button type="submit" className="btn-primary text-sm min-w-[130px] justify-center">
                  <Send size={14} />
                  {t('contact.send')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
