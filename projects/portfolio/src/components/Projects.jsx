import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExternalLink,
  Github,
  Lock,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react'
import { projects, upcomingProjects } from '../data/projects'
import { useI18n } from '../i18n'

function ProjectCard({ project, index }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  const statusColors = {
    active: { bg: 'bg-cyan/10', text: 'text-cyan', border: 'border-cyan/20', label: t('projects.status.active') },
    completed: { bg: 'bg-matrix/10', text: 'text-matrix', border: 'border-matrix/20', label: t('projects.status.completed') },
    wip: { bg: 'bg-amber/10', text: 'text-amber', border: 'border-amber/20', label: t('projects.status.wip') },
  }
  const status = statusColors[project.status] || statusColors.active

  return (
    <motion.article
      className="card-project flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      aria-label={project.title}
    >
      {/* Card header */}
      <div className="p-5 sm:p-6 pb-0">
        {/* Top row: category + status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            {project.category}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold ${status.bg} ${status.text} border ${status.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.text.replace('text-', 'bg-')} animate-pulse`} />
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{project.title}</h3>
        <p className="text-sm text-slate-500 mb-3">{project.subtitle}</p>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{project.description}</p>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tech.map((tech) => (
            <span key={tech} className="tag tag-slate">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-4 space-y-4">
              {/* Long description */}
              <p className="text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                {project.longDescription}
              </p>

              {/* Highlights */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan mb-2 flex items-center gap-1.5">
                  <Zap size={12} /> {t('projects.highlights')}
                </h4>
                <ul className="space-y-1.5">
                  {project.highlights.map((h) => (
                    <li key={h} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-matrix mt-0.5 shrink-0">▸</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Challenges / What I learned */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} /> {t('projects.challenges')}
                </h4>
                <ul className="space-y-1.5">
                  {project.challenges.map((c) => (
                    <li key={c} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-amber mt-0.5 shrink-0">▸</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card footer */}
      <div className="mt-auto px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-white/5 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-mono text-slate-500 hover:text-cyan transition-colors flex items-center gap-1.5"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? t('projects.lessDetails') : t('projects.moreDetails')}
        </button>

        <div className="flex items-center gap-2">
          {project.private ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono">
              <Lock size={12} /> {t('projects.private')}
            </span>
          ) : (
            <>
              {project.links?.source && (
                <a
                  href={project.links.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-white/5 text-slate-400 hover:text-cyan hover:bg-white/10 transition-all"
                  aria-label={`Source code for ${project.title}`}
                >
                  <Github size={12} /> {t('projects.code')}
                </a>
              )}
              {project.links?.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 transition-all"
                  aria-label={`Live demo for ${project.title}`}
                >
                  <ExternalLink size={12} /> {t('projects.demo')}
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default function ProjectsSection() {
  const { t } = useI18n()
  const featured = projects.filter((p) => p.featured)
  const other = projects.filter((p) => !p.featured)

  return (
    <section id="projects" className="py-20 sm:py-28 px-4 sm:px-6 relative" aria-label={t('projects.title')}>
      <div className="absolute top-0 left-0 right-0 section-divider" aria-hidden="true" />

      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-mono text-xs text-matrix uppercase tracking-widest mb-3">
            {t('projects.subtitle')}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-matrix">{t('projects.title')}</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            {t('projects.description')}
          </p>
        </motion.div>

        {/* Featured projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12">
          {featured.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>

        {/* Other projects */}
        {other.length > 0 && (
          <>
            <motion.h3
              className="text-lg font-bold text-slate-400 mb-6 flex items-center gap-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-slate-600 font-mono text-sm">//</span>
              {t('projects.otherProjects')}
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12">
              {other.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i + featured.length} />
              ))}
            </div>
          </>
        )}

        {/* Upcoming / WIP */}
        {upcomingProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-lg font-bold text-slate-400 mb-6 flex items-center gap-2">
              <Clock size={16} className="text-amber" />
              {t('projects.upcoming')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingProjects.map((p) => (
                <div key={p.id} className="glass rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-amber" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-1">{p.title}</h4>
                    <p className="text-xs text-slate-500 mb-2">{p.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tech.map((tech) => (
                        <span key={tech} className="tag tag-amber">{tech}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
