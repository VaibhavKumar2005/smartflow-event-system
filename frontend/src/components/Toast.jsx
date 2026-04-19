import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const STYLES = {
  error:   { border: 'border-danger/20',  text: 'text-danger',   icon: '✕', bar: 'bg-danger'  },
  success: { border: 'border-success/20', text: 'text-success',  icon: '✓', bar: 'bg-success' },
  info:    { border: 'border-primary/20', text: 'text-primary',  icon: 'ℹ', bar: 'bg-primary' },
}

export default function Toast({ message, type = 'info', onDismiss, duration = 5000 }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!message) { setShow(false); return }
    setShow(true)
    const id = setTimeout(() => { setShow(false); setTimeout(onDismiss, 200) }, duration)
    return () => clearTimeout(id)
  }, [message, duration, onDismiss])

  const s = STYLES[type] ?? STYLES.info

  if (!message) return null

  return (
    <div className="fixed top-14 inset-x-0 z-50 flex justify-center pointer-events-none">
      <div
        className={cn(
          'pointer-events-auto relative flex items-center gap-3 px-4 py-2 rounded-xl border bg-card text-[12px] font-medium overflow-hidden',
          'transition-all duration-200',
          show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
          s.border,
        )}
      >
        <span className={cn('font-semibold text-sm', s.text)}>{s.icon}</span>
        <span className="text-text-main text-xs">{message}</span>
        <button onClick={() => { setShow(false); setTimeout(onDismiss, 200) }} className="ml-1 text-text-sub hover:text-text-main transition-colors text-xs">✕</button>
        {/* Progress bar */}
        <div
          className={cn('absolute bottom-0 left-0 right-0 h-[1.5px] origin-left', s.bar)}
          style={{ animation: show ? `shrink ${duration}ms linear forwards` : 'none' }}
        />
        <style>{`@keyframes shrink { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>
      </div>
    </div>
  )
}
