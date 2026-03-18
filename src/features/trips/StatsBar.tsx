import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Route, Clock, FileText, ShieldCheck, AlertTriangle } from 'lucide-react'
 
import type { Trip } from '@/types/trip'

interface StatsBarProps {
  trip: Trip
}

interface StatChipProps {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
}

const StatChip = ({ icon, label, value, unit }: StatChipProps) => (
  <div className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low/78 px-3.5 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 [&_svg]:h-[1.35rem] [&_svg]:w-[1.35rem]">{icon}</div>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{label}</p>
      <p className="mt-1 text-lg font-bold font-mono leading-none text-emerald-700 dark:text-emerald-300 sm:text-[1.6rem]">
        <span data-count-up={value}>0</span>
        <span className="ml-1 text-[11px] font-normal text-emerald-700/75 dark:text-emerald-300/75">{unit}</span>
      </p>
    </div>
  </div>
)

export const StatsBar = ({ trip }: StatsBarProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const targets = containerRef.current.querySelectorAll('[data-count-up]')
    targets.forEach((el) => {
      const target = parseFloat(el.getAttribute('data-count-up') || '0')
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate() {
          el.textContent = obj.val.toFixed(1)
        },
      })
    })
  }, [trip])

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <StatChip
        icon={<Route />}
        label="Total Distance"
        value={trip.total_distance_miles}
        unit="mi"
      />
      <StatChip
        icon={<Clock />}
        label="Drive Time"
        value={trip.total_drive_hours}
        unit="hrs"
      />
      <StatChip
        icon={<FileText />}
        label="Log Sheets"
        value={trip.daily_logs.length}
        unit="days"
      />
      <div className="flex min-h-[68px] items-center rounded-2xl border border-outline-variant/30 bg-surface-container-low/78 px-3.5 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
          trip.hos_compliant
            ? "bg-emerald-500/18 text-emerald-700 dark:text-emerald-300"
            : "bg-destructive/20 text-destructive"
        }`}>
          {trip.hos_compliant ? (
            <>
              <ShieldCheck className="h-4.5 w-4.5" />
              HOS Compliant
            </>
          ) : (
            <>
              <AlertTriangle className="h-4.5 w-4.5" />
              Check Hours
            </>
          )}
        </div>
      </div>
    </div>
  )
}
