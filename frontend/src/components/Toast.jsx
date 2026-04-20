import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const STYLES = {
  error:   { border: 'border-danger/30',  text: 'text-red-300',    icon: '✕', bar: 'bg-danger'  },
  success: { border: 'border-success/30', text: 'text-green-300',  icon: '✓', bar: 'bg-success' },
  info:    { border: 'border-primary/30', text: 'text-indigo-300', icon: 'ℹ', bar: 'bg-primary' },
}

export default function Toast({ message, type = 'info', onDismiss, duration = 5000 }) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDismiss, duration)
    return () => clearTimeout(id)
  }, [message, duration, onDismiss])

  const s = STYLES[type] ?? STYLES.info

  return (
    <div className="fixed top-16 inset-x-0 z-50 flex justify-center pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'pointer-events-auto relative flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-card shadow-card text-[12px] font-medium overflow-hidden',
              s.border,
            )}
          >
            <span className={cn('font-bold text-sm', s.text)}>{s.icon}</span>
            <span className="text-slate-300">{message}</span>
            <button onClick={onDismiss} className="ml-2 text-muted hover:text-slate-300 transition-colors text-xs">✕</button>
            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={cn('absolute bottom-0 left-0 right-0 h-0.5 origin-left', s.bar)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
