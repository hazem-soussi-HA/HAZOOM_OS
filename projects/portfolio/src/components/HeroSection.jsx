import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, Terminal } from 'lucide-react'
import { useI18n } from '../i18n'

function MatrixRain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops = Array(columns).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00ff4115'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="matrix-rain-canvas" aria-hidden="true" />
}

export default function HeroSection() {
  const { t } = useI18n()
  return (
    <section
      className="relative min-h-screen flex flex-col px-4 sm:px-6"
      aria-label="Hero"
    >
      <MatrixRain />

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-cyan/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-matrix/5 rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* HS watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          className="font-mono font-black text-[min(40vw,400px)] leading-none opacity-[0.015]"
          style={{
            background: 'linear-gradient(135deg, #00d4ff15, #00ff4115)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.05em',
          }}
        >
          HS
        </span>
      </div>

      {/* Centered content — flex-1 fills available space */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto relative z-10 text-center">
        {/* Terminal prompt */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 sm:mb-8 text-xs sm:text-sm font-mono text-cyan"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Terminal size={14} />
          <span>shadow@hazoom-os ~ % whoami</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] mb-4 sm:mb-6 tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <span className="text-white">{t('hero.title1')}</span>
          <br />
          <span className="gradient-text-cyan">{t('hero.title2')}</span>
          <br />
          <span className="text-white">& </span>
          <span className="gradient-text-matrix">{t('hero.title3')}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {t('hero.subtitle')}
          <br className="hidden sm:block" />
          <span className="text-slate-500">{t('hero.subtitle2')}</span>
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <a href="#projects" className="btn-primary">
            {t('hero.cta.projects')}
          </a>
          <a href="#contact" className="btn-secondary">
            {t('hero.cta.contact')}
          </a>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          {[
            { value: 'HAZOOM OS', label: t('hero.stats.os') },
            { value: 'MARIO GTA6', label: t('hero.stats.game') },
            { value: '8+', label: t('hero.stats.languages') },
            { value: '70+', label: t('hero.stats.apps') },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl px-3 py-3 sm:p-4 text-center">
              <div className="font-mono font-bold text-sm sm:text-base text-cyan">{stat.value}</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-tight">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator — pushed to bottom by flex-1 above, never clipped */}
      <div className="flex justify-center pb-6 sm:pb-8 relative z-10">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <a href="#about" aria-label="Scroll to about section" className="flex flex-col items-center gap-2 text-slate-600 hover:text-cyan transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-widest">Scroll</span>
            <ArrowDown size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
