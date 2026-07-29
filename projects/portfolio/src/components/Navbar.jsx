import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Globe } from 'lucide-react'
import { useI18n } from '../i18n'

export default function Navbar() {
  const { t, lang, setLang } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '#about', label: t('nav.about') },
    { href: '#projects', label: t('nav.projects') },
    { href: '#skills', label: t('nav.skills') },
    { href: '#contact', label: t('nav.contact') },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleNavClick = (e, href) => {
    e.preventDefault()
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const toggleLang = () => {
    setLang(lang === 'fr' ? 'en' : 'fr')
  }

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'py-2' : 'py-4'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            className={`flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-300 ${
              scrolled ? 'glass glow-cyan' : 'bg-transparent'
            }`}
          >
            {/* Logo */}
            <a
              href="#"
              className="font-mono font-bold text-lg tracking-tight"
              aria-label="Home"
            >
              <span className="text-cyan">HS</span>
              <span className="text-slate-500 ml-1 text-sm font-normal hidden sm:inline">
                Hazem Soussi
              </span>
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-3 py-2 text-sm text-slate-400 hover:text-cyan transition-colors rounded-lg hover:bg-white/5 whitespace-nowrap"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={toggleLang}
                className="ml-2 p-2 text-slate-400 hover:text-cyan transition-colors rounded-lg hover:bg-white/5"
                aria-label="Toggle language"
              >
                <Globe size={16} />
                <span className="ml-1 text-xs font-mono font-semibold uppercase">{lang}</span>
              </button>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className="ml-1 px-5 py-2 text-sm font-semibold rounded-xl bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 hover:border-cyan/40 transition-all"
              >
                {t('nav.contact')}
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-cyan transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-void/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-6">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-2xl font-semibold text-slate-300 hover:text-cyan transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.button
                onClick={toggleLang}
                className="flex items-center gap-2 px-5 py-2 text-lg font-mono font-semibold text-slate-400 hover:text-cyan transition-colors border border-white/10 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Globe size={18} />
                {lang === 'fr' ? 'EN' : 'FR'}
              </motion.button>
              <motion.a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className="mt-2 px-8 py-3 text-lg font-semibold rounded-xl bg-cyan/10 text-cyan border border-cyan/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {t('nav.contact')}
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
