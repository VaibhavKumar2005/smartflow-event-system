import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const TOAST_STYLES = {
  error:   { bg: 'bg-red-500/10 border-red-500/30',     text: 'text-red-400',     bar: 'bg-red-400' },
  success: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', bar: 'bg-emerald-400' },
  info:    { bg: 'bg-brand-500/10 border-brand-500/30',  text: 'text-brand-400',   bar: 'bg-brand-400' },
}

const ICONS = {
  error:   '✕',
  success: '✓',
  info:    'ℹ',
}

export default function Toast({ message, type = 'error', onDismiss, duration = 5000 }) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDismiss, duration)
    return () => clearTimeout(id)
  }, [message, duration, onDismiss])

  const style = TOAST_STYLES[type] ?? TOAST_STYLES.info

  return (
    <div className="fixed top-14 inset-x-0 z-50 flex justify-center pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'pointer-events-auto relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-card text-sm font-medium overflow-hidden',
              style.bg
            )}
          >
            <span className={cn('text-base font-bold', style.text)}>{ICONS[type]}</span>
            <span className="text-slate-200">{message}</span>
            <button
              onClick={onDismiss}
              className="ml-2 text-slate-500 hover:text-slate-300 transition-colors text-xs"
            >
              ✕
            </button>

            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={cn('absolute bottom-0 left-0 right-0 h-0.5 origin-left', style.bar)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
