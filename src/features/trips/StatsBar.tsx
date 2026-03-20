import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Route, Clock, FileText, ShieldCheck, AlertTriangle } from 'lucide-react'

import type { Trip } from '@/types/trip'

interface StatsBarProps {
  trip: Trip
  /** Shorter tiles for compact trip header */
  compact?: boolean
}

interface StatChipProps {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  compact?: boolean
}

const StatChip = ({ icon, label, value, unit, compact }: StatChipProps) => (
  <div
    className={`group relative flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-primary-ui-border-muted/55 bg-gradient-to-br from-surface via-surface to-surface-container-low/80 shadow-sm transition-all duration-300 hover:border-primary-ui-border dark:border-white/10 dark:from-surface-container/85 dark:to-surface-container-low/35 dark:shadow-[0_4px_20px_rgba(0,0,0,0.28)] dark:hover:border-primary-ui-border-muted ${
      compact ? 'min-h-[44px] px-2 py-1' : 'min-h-[56px] gap-3 px-3.5 py-2 shadow-[0_4px_20px_rgba(15,23,42,0.05)]'
    }`}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute -right-4 -top-8 h-20 w-20 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-primary/18"
    />
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary dark:from-primary/25 ${
        compact ? 'h-8 w-8' : 'h-10 w-10 rounded-xl'
      }`}
    >
      {icon}
    </div>
    <div className="relative min-w-0 flex-1">
      <p className="truncate text-[8px] font-bold uppercase tracking-[0.18em] text-on-surface-variant dark:text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 font-mono font-bold leading-none tracking-tight text-on-surface ${compact ? 'text-base' : 'text-[1.35rem] sm:text-[1.45rem]'}`}
      >
        <span data-count-up={value}>0</span>
        <span className="ml-1 text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant dark:text-muted-foreground">{unit}</span>
      </p>
    </div>
  </div>
)

export const StatsBar = ({ trip, compact }: StatsBarProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const targets = containerRef.current.querySelectorAll('[data-count-up]')
    targets.forEach((el) => {
      const target = parseFloat(el.getAttribute('data-count-up') || '0')
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target,
        duration: compact ? 1.05 : 1.35,
        ease: 'power3.out',
        onUpdate() {
          el.textContent = obj.val.toFixed(1)
        },
      })
    })
  }, [trip, compact])

  return (
    <div
      ref={containerRef}
      className={`grid grid-cols-2 xl:grid-cols-4 [&_svg]:shrink-0 ${compact ? 'gap-1.5 [&_svg]:h-[0.95rem] [&_svg]:w-[0.95rem]' : 'gap-3 [&_svg]:h-[1.15rem] [&_svg]:w-[1.15rem]'}`}
    >
      <StatChip icon={<Route className="text-primary" />} label="Total distance" value={trip.total_distance_miles} unit="mi" compact={compact} />
      <StatChip icon={<Clock className="text-primary" />} label="Drive time" value={trip.total_drive_hours} unit="hrs" compact={compact} />
      <StatChip icon={<FileText className="text-primary" />} label="Log sheets" value={trip.daily_logs.length} unit="days" compact={compact} />
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-primary-ui-border-muted/60 bg-gradient-to-br from-surface to-surface-container-low/90 shadow-sm dark:border-white/10 dark:from-surface-container/75 dark:to-surface-container-low/25 dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] ${
          compact ? 'min-h-[44px] px-2 py-1' : 'min-h-[56px] px-3 py-2'
        }`}
      >
        <div
          className={`relative z-[1] flex w-full items-center justify-center gap-1.5 rounded-lg text-center font-bold uppercase tracking-[0.1em] ${
            compact ? 'px-2 py-1 text-[9px]' : 'rounded-xl px-3 py-2.5 text-[11px] tracking-[0.12em]'
          } ${
            trip.hos_compliant
              ? 'bg-primary/12 text-emerald-800 dark:bg-gradient-to-r dark:from-primary/22 dark:to-emerald-500/12 dark:text-primary'
              : 'bg-destructive/12 text-destructive'
          }`}
        >
          {trip.hos_compliant ? (
            <>
              <ShieldCheck className={`shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
              {compact ? 'HOS ok' : 'HOS compliant'}
            </>
          ) : (
            <>
              <AlertTriangle className={`shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
              {compact ? 'Review' : 'Review hours'}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
