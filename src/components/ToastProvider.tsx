import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

interface ToastInput {
  title: string
  description?: string
}

interface ToastContextValue {
  success: (toast: ToastInput) => void
  error: (toast: ToastInput) => void
  info: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastStyles: Record<ToastTone, { icon: typeof Info; classes: string }> = {
  success: {
    icon: CheckCircle2,
    classes: 'border-[color:rgba(0,226,144,0.35)] bg-[rgba(0,226,144,0.12)] text-on-surface',
  },
  error: {
    icon: AlertCircle,
    classes: 'border-[color:rgba(255,180,171,0.35)] bg-[rgba(255,180,171,0.12)] text-on-surface',
  },
  info: {
    icon: Info,
    classes: 'border-[color:rgba(166,230,255,0.35)] bg-[rgba(166,230,255,0.12)] text-on-surface',
  },
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((tone: ToastTone, toast: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, { id, tone, ...toast }])
  }, [])

  const api = useMemo<ToastContextValue>(
    () => ({
      success: (toast) => pushToast('success', toast),
      error: (toast) => pushToast('error', toast),
      info: (toast) => pushToast('info', toast),
    }),
    [pushToast],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[220] flex justify-center px-4">
        <div className="flex w-full max-w-xl flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <ToastCard key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  )
}

const ToastCard = ({ toast, onClose }: { toast: ToastItem; onClose: () => void }) => {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4500)
    return () => window.clearTimeout(timer)
  }, [onClose])

  const { icon: Icon, classes } = toastStyles[toast.tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${classes}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-background/70 p-1.5">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm text-on-surface-variant">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-background/60 hover:text-on-surface"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return context
}
