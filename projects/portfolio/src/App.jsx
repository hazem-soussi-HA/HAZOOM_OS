import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import AboutSection from './components/AboutSection'
import ProjectsSection from './components/Projects'
import SkillsSection from './components/SkillsSection'
import ContactSection from './components/ContactSection'
import { useI18n } from './i18n'

function FloatingHS() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-xl glass glow-cyan flex items-center justify-center cursor-pointer group"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          whileHover={{ scale: 1.1 }}
          aria-label="Scroll to top"
        >
          <span className="font-mono font-bold text-sm text-cyan group-hover:text-white transition-colors">HS</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="py-8 px-4 text-center border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs text-slate-600 font-mono">
          <span className="text-cyan">HS</span> — Hazem Soussi &copy; {new Date().getFullYear()}
        </p>
        <p className="mt-1 text-[10px] text-slate-700 font-mono">
          {t('footer.built')}
        </p>
        <p className="mt-2 text-[10px] text-slate-800 font-mono italic">
          {t('footer.motto')}
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="relative min-h-screen bg-void">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>
      <FloatingHS />
      <Footer />
    </div>
  )
}
