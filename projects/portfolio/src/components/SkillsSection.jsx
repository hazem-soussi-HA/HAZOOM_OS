import { motion } from 'framer-motion'
import { skills } from '../data/projects'
import { useI18n } from '../i18n'

const levelColors = {
  expert: { bar: 'bg-cyan', text: 'text-cyan', width: 'w-full' },
  advanced: { bar: 'bg-cyan/70', text: 'text-cyan/70', width: 'w-4/5' },
  intermediate: { bar: 'bg-matrix', text: 'text-matrix', width: 'w-3/5' },
  basic: { bar: 'bg-amber', text: 'text-amber', width: 'w-2/5' },
}

function SkillBar({ skill, t }) {
  const style = levelColors[skill.level] || levelColors.intermediate
  const levelKey = t(`skills.level.${skill.level}`, { returnObjects: true })
  const levelLabel = typeof levelKey === 'string' ? levelKey : skill.level
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
          {skill.name}
        </span>
        <span className={`text-[10px] font-mono uppercase ${style.text}`}>
          {levelLabel}
        </span>
      </div>
      {skill.note && (
        <p className="text-[11px] text-slate-600 mb-2">{skill.note}</p>
      )}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${style.bar}`}
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{ maxWidth: skill.level === 'expert' ? '100%' : skill.level === 'advanced' ? '80%' : skill.level === 'intermediate' ? '60%' : '40%' }}
        />
      </div>
    </div>
  )
}

export default function SkillsSection() {
  const { t } = useI18n()
  return (
    <section id="skills" className="py-20 sm:py-28 px-4 sm:px-6 relative" aria-label={t('skills.title')}>
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
          <p className="font-mono text-xs text-amber uppercase tracking-widest mb-3">
            {t('skills.subtitle')}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="gradient-text-mixed">{t('skills.title')}</span>
          </h2>
        </motion.div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {Object.entries(skills).map(([category, skillList], catIndex) => (
            <motion.div
              key={category}
              className="glass rounded-2xl p-5 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.08, duration: 0.5 }}
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan/60" />
                {category}
              </h3>
              <div className="space-y-4">
                {skillList.map((skill) => (
                  <SkillBar key={skill.name} skill={skill} t={t} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
