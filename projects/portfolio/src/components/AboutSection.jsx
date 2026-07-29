import { motion } from 'framer-motion'
import { MapPin, Code2, Heart, Globe } from 'lucide-react'
import { useI18n } from '../i18n'

export default function AboutSection() {
  const { t } = useI18n()
  const tags = t('about.expertiseTags', { returnObjects: true })
  const tagsArr = Array.isArray(tags) ? tags : ['Operating Systems', 'Game Development', 'Full-Stack Web', 'Artificial Intelligence', 'DevOps & Security', 'Kernel Programming']

  return (
    <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 relative" aria-label={t('about.title')}>
      <div className="absolute top-0 left-0 right-0 section-divider" aria-hidden="true" />

      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-mono text-xs text-cyan uppercase tracking-widest mb-3">
            {t('about.subtitle')}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="gradient-text-cyan">{t('about.title')}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8 sm:gap-12">
          {/* Left: Photo / Identity */}
          <motion.div
            className="md:col-span-2 flex flex-col items-center"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Photo */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden mb-6 glass glow-cyan">
              <img
                src={import.meta.env.BASE_URL + 'hazem-photo.jpg'}
                alt={t('about.name')}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan/5 to-transparent animate-scan-line pointer-events-none"
                aria-hidden="true"
              />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-1">{t('about.name')}</h3>
              <p className="text-sm text-slate-400 font-mono mb-3">{t('about.role')}</p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <MapPin size={12} />
                <span>{t('about.location')}</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Bio */}
          <motion.div
            className="md:col-span-3 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* Terminal-style bio */}
            <div className="glass rounded-2xl p-5 sm:p-6 font-mono text-sm leading-relaxed">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 text-[10px] text-slate-600">identity.txt</span>
              </div>
              <p className="text-slate-300 mb-3">
                <span className="text-cyan">$</span> cat /identity/whoami.txt
              </p>
              <p className="text-slate-400 mb-4">
                {t('about.whoami')}
              </p>
              <p className="text-slate-300 mb-3">
                <span className="text-cyan">$</span> cat /identity/mission.txt
              </p>
              <p className="text-slate-400">
                {t('about.mission')}
              </p>
            </div>

            {/* Key values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Code2, title: t('about.build'), desc: t('about.buildDesc'), color: 'cyan' },
                { icon: Heart, title: t('about.heal'), desc: t('about.healDesc'), color: 'matrix' },
                { icon: Globe, title: t('about.share'), desc: t('about.shareDesc'), color: 'amber' },
              ].map((item) => (
                <div key={item.title} className="glass rounded-xl p-4 text-center glass-hover">
                  <item.icon
                    size={20}
                    className={`mx-auto mb-2 ${
                      item.color === 'cyan' ? 'text-cyan' : item.color === 'matrix' ? 'text-matrix' : 'text-amber'
                    }`}
                  />
                  <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Expertise tags */}
            <div className="flex flex-wrap gap-2">
              {tagsArr.map((tag) => (
                <span key={tag} className="tag tag-cyan">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
