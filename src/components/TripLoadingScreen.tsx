import { motion } from 'framer-motion'
import { LoaderCircle, MapPin, Route, ClipboardList } from 'lucide-react'
import { TypewriterText } from './TypewriterText'

interface TripLoadingScreenProps {
  onComplete?: () => void
}

export const TripLoadingScreen = ({ onComplete }: TripLoadingScreenProps) => {
  void onComplete

  const stages = [
    { label: 'Routing', icon: Route },
    { label: 'Stops', icon: MapPin },
    { label: 'Logs', icon: ClipboardList },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-4 py-6 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="w-full max-w-[26rem] rounded-[28px] border border-outline-variant/40 bg-surface-container-low px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
      >
        <div className="rounded-[22px] border border-outline-variant/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <LoaderCircle className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Trip In Progress</p>
              <p className="mt-0.5 text-sm text-on-surface-variant">Checking the best route and building clean daily logs.</p>
            </div>
          </div>

          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/8">
            <motion.div
              animate={{ x: ['-100%', '260%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/2 rounded-full bg-[linear-gradient(90deg,rgba(0,255,163,0),rgba(0,255,163,0.95),rgba(166,230,255,0))]"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {stages.map(({ label, icon: Icon }, index) => (
              <motion.div
                key={label}
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.16 }}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center"
              >
                <Icon className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center font-headline text-[1.55rem] font-bold text-on-surface">
          <TypewriterText text="Building Your Trip Plan" speed={45} />
        </p>
        <p className="mt-1.5 text-center text-sm text-on-surface-variant">
          Finalizing route details, stop timing, and driver logs.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-on-surface-variant">
          {['Checking paths', 'Validating HOS', 'Preparing logs'].map((step, index) => (
            <div key={step} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
              <motion.span
                animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.18 }}
                className="h-1.5 w-1.5 rounded-full bg-primary"
              />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
