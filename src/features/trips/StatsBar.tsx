import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Route, Clock, FileText, ShieldCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-card/50">
    <div className="text-primary">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold font-mono">
        <span data-count-up={value}>0</span>
        <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
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
    <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3">
      <StatChip
        icon={<Route className="h-4 w-4" />}
        label="Total Distance"
        value={trip.total_distance_miles}
        unit="mi"
      />
      <StatChip
        icon={<Clock className="h-4 w-4" />}
        label="Drive Time"
        value={trip.total_drive_hours}
        unit="hrs"
      />
      <StatChip
        icon={<FileText className="h-4 w-4" />}
        label="Log Sheets"
        value={trip.daily_logs.length}
        unit="days"
      />
      <div className="flex items-center gap-2 rounded-lg border border-border p-3 bg-card/50">
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
          trip.hos_compliant
            ? "bg-success/20 text-success"
            : "bg-destructive/20 text-destructive"
        )}>
          {trip.hos_compliant ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              HOS Compliant
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              Check Hours
            </>
          )}
        </div>
      </div>
    </div>
  )
}
