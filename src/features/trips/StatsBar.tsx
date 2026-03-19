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
  <div className="flex min-h-[56px] items-center gap-2.5 rounded-[20px] border border-outline-variant/25 bg-surface-container-low/72 px-3 py-1.5 shadow-[0_6px_14px_rgba(15,23,42,0.05)] dark:bg-surface-container-low/72">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 [&_svg]:h-[1.1rem] [&_svg]:w-[1.1rem]">{icon}</div>
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">{label}</p>
      <p className="mt-0.5 text-[1.35rem] font-bold font-mono leading-none text-emerald-700 dark:text-emerald-300 sm:text-[1.45rem]">
        <span data-count-up={value}>0</span>
        <span className="ml-1 text-[10px] font-normal text-emerald-700/75 dark:text-emerald-300/75">{unit}</span>
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
    <div ref={containerRef} className="grid grid-cols-2 gap-2 xl:grid-cols-4">
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
      <div className="flex min-h-[56px] items-center rounded-[20px] border border-outline-variant/25 bg-surface-container-low/72 px-3 py-1.5 shadow-[0_6px_14px_rgba(15,23,42,0.05)]">
        <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
          trip.hos_compliant
            ? "bg-emerald-500/18 text-emerald-700 dark:text-emerald-300"
            : "bg-destructive/20 text-destructive"
        }`}>
          {trip.hos_compliant ? (
            <>
              <ShieldCheck className="h-4 w-4" />
              HOS Compliant
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              Check Hours
            </>
          )}
        </div>
      </div>
    </div>
  )
}
