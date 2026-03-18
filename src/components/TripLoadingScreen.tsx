import { motion } from 'framer-motion'
import { Truck, MapPin, ClipboardList, Sparkles, Route } from 'lucide-react'
import { TypewriterText } from './TypewriterText'

interface TripLoadingScreenProps {
  onComplete?: () => void
}

export const TripLoadingScreen = ({ onComplete }: TripLoadingScreenProps) => {
  void onComplete

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[32px] border border-outline-variant/40 bg-surface-container-low px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="relative mx-auto overflow-hidden rounded-[28px] border border-outline-variant/30 bg-[radial-gradient(circle_at_top,_rgba(0,255,163,0.18),_transparent_45%),linear-gradient(180deg,_rgba(28,27,27,1),_rgba(14,14,14,1))] px-6 py-6">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle,_rgba(166,230,255,0.16),_transparent_60%)] blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
              <span>Current</span>
              <span>Pickup</span>
              <span>Dropoff</span>
            </div>

            <div className="relative mt-7">
              <div className="h-[3px] rounded-full bg-white/10" />
              <motion.div
                animate={{ backgroundPositionX: ['0%', '100%'] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,transparent,rgba(0,255,163,0.95),transparent)] bg-[length:35%_100%]"
              />
              <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
                {[MapPin, Truck, ClipboardList].map((Icon, index) => (
                  <motion.div
                    key={index}
                    animate={{ y: [0, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.9, repeat: Infinity, delay: index * 0.2 }}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-surface-container-high/95 text-primary shadow-[0_12px_30px_rgba(0,255,163,0.14)]"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                ))}
              </div>
              <motion.div
                animate={{ left: ['0%', 'calc(100% - 52px)'], y: [0, -2, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/2 z-10 -translate-y-1/2"
              >
                <div className="flex h-13 w-13 items-center justify-center rounded-[18px] border border-secondary/20 bg-secondary/10 text-secondary shadow-[0_12px_30px_rgba(166,230,255,0.18)]">
                  <Truck className="h-6 w-6" />
                </div>
              </motion.div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/8 bg-[rgba(15,23,42,0.36)] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                <Route className="h-3.5 w-3.5 text-primary" />
                Route computation
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: 'Routes', value: 'Evaluating' },
                  { label: 'HOS', value: 'Validating' },
                  { label: 'Logs', value: 'Generating' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2.1, repeat: Infinity, delay: index * 0.18 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{item.label}</p>
                    <p className="mt-1 text-xs font-semibold text-on-surface">{item.value}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-on-surface">
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                Matching the fastest route against safe alternatives
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center font-headline text-2xl font-bold text-on-surface">
          <TypewriterText text="Building Your Trip Plan" speed={45} />
        </p>
        <p className="mt-2 text-center text-sm text-on-surface-variant">
          We’re refreshing route choices and HOS-safe log sheets until the computation finishes.
        </p>
      </div>
    </div>
  )
}
