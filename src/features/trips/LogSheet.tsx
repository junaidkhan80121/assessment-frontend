import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { BedDouble, Coffee, Fuel, MapPinned, Truck } from 'lucide-react'
import type { DailyLog, Trip } from '@/types/trip'
import blankPaperLogUrl from '@/assets/blank-paper-log.png'

interface LogSheetProps {
  trip: Trip
  dayLog: DailyLog
  dayNumber: number
}

const STATUS_ROWS: Record<string, number> = {
  OFF_DUTY: 0,
  SLEEPER: 1,
  DRIVING: 2,
  ON_DUTY_NOT_DRIVING: 3,
}

const CANVAS_WIDTH = 1026
const CANVAS_HEIGHT = 1036
const GRID_LEFT = 52
const GRID_RIGHT = 447
const GRID_TOP = 345
const ROW_HEIGHT = 46

let templatePromise: Promise<HTMLImageElement> | null = null

function loadTemplateImage(): Promise<HTMLImageElement> {
  if (!templatePromise) {
    templatePromise = new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = blankPaperLogUrl
    })
  }

  return templatePromise
}

export async function renderLogSheetCanvas(
  canvas: HTMLCanvasElement,
  trip: Trip,
  dayLog: DailyLog,
  dayNumber: number,
) {
  const templateImage = await loadTemplateImage()
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  canvas.width = CANVAS_WIDTH * dpr
  canvas.height = CANVAS_HEIGHT * dpr
  canvas.style.width = '100%'
  canvas.style.height = 'auto'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.drawImage(templateImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const [monthLabel, dayLabel, yearLabel] = splitLogDate(trip.created_at, dayNumber)
  const totalHours = (
    dayLog.totals.OFF_DUTY +
    dayLog.totals.SLEEPER +
    dayLog.totals.DRIVING +
    dayLog.totals.ON_DUTY_NOT_DRIVING
  ).toFixed(2)
  const vehicleNumbers = `TRK-${trip.id.slice(0, 4).toUpperCase()} / TRL-${trip.id.slice(4, 8).toUpperCase()}`
  const shippingDocument = `DOC-${trip.id.slice(0, 8).toUpperCase()}`
  const shipperCommodity = `${trip.pickup_location} to ${trip.dropoff_location}`

  ctx.fillStyle = '#111827'
  ctx.font = 'bold 16px "IBM Plex Sans", sans-serif'
  fillText(ctx, trip.current_location, 110, 60, 280)
  fillText(ctx, trip.dropoff_location, 525, 60, 280)

  ctx.font = '12px "IBM Plex Sans", sans-serif'
  fillText(ctx, monthLabel, 224, 20, 28)
  fillText(ctx, dayLabel, 302, 20, 20)
  fillText(ctx, yearLabel, 377, 20, 52)
  fillText(ctx, `${Math.round(dayLog.totals.DRIVING)} hrs`, 62, 109, 120)
  fillText(ctx, `${Math.round(dayLog.total_miles_driving_today)} mi`, 191, 109, 120)
  fillText(ctx, 'Vanguard Fleet Ops', 642, 109, 225)
  fillText(ctx, vehicleNumbers, 71, 145, 315)
  fillText(ctx, 'Chicago, IL', 655, 145, 210)
  fillText(ctx, trip.current_location, 652, 177, 215)

  // Draw duty status lines on top of the FMCSA grid.
  const entries = dayLog.duty_entries
  entries.forEach((entry) => {
    const row = STATUS_ROWS[entry.status]
    if (row === undefined) return

    const startMin = timeToMinutes(entry.start)
    const endMin = timeToMinutes(entry.end)
    const x1 = GRID_LEFT + (startMin / 1440) * (GRID_RIGHT - GRID_LEFT)
    const x2 = GRID_LEFT + (endMin / 1440) * (GRID_RIGHT - GRID_LEFT)
    const y = GRID_TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2

    ctx.beginPath()
    ctx.moveTo(x1, y)
    ctx.lineTo(x2, y)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 3
    ctx.stroke()
  })

  for (let i = 0; i < entries.length - 1; i += 1) {
    const current = entries[i]
    const next = entries[i + 1]
    const currentRow = STATUS_ROWS[current.status]
    const nextRow = STATUS_ROWS[next.status]
    if (currentRow === undefined || nextRow === undefined || currentRow === nextRow) {
      continue
    }

    const transitionMin = timeToMinutes(current.end)
    const x = GRID_LEFT + (transitionMin / 1440) * (GRID_RIGHT - GRID_LEFT)
    const y1 = GRID_TOP + currentRow * ROW_HEIGHT + ROW_HEIGHT / 2
    const y2 = GRID_TOP + nextRow * ROW_HEIGHT + ROW_HEIGHT / 2

    ctx.beginPath()
    ctx.moveTo(x, y1)
    ctx.lineTo(x, y2)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  ctx.fillStyle = '#111827'
  ctx.font = '12px "IBM Plex Sans", sans-serif'
  dayLog.remarks.slice(0, 7).forEach((remark, index) => {
    fillText(ctx, `${remark.time} ${remark.note} - ${remark.location}`, 26, 598 + index * 26, 460)
  })

  fillText(ctx, shippingDocument, 45, 780, 175)
  fillText(ctx, shipperCommodity, 45, 846, 300)
  fillText(ctx, dayLog.recap.on_duty_today.toFixed(2), 185, 959, 40)
  fillText(ctx, dayLog.recap.on_duty_last_8_days.toFixed(2), 335, 959, 45)
  fillText(ctx, dayLog.recap.available_tomorrow.toFixed(2), 487, 959, 45)
  fillText(ctx, dayLog.recap.on_duty_today.toFixed(2), 639, 959, 45)
  fillText(ctx, dayLog.recap.on_duty_last_8_days.toFixed(2), 790, 959, 45)
  fillText(ctx, trip.weekly_hours_remaining.toFixed(2), 936, 959, 50)

  fillText(ctx, totalHours, 969, 253, 40)
  fillText(ctx, trip.pickup_location, 169, 875, 180)
  fillText(ctx, trip.dropoff_location, 335, 875, 180)

  if (dayLog.recap.hours_critical || dayLog.recap.hours_warning) {
    ctx.fillStyle = dayLog.recap.hours_critical ? '#dc2626' : '#d97706'
    ctx.font = 'bold 16px "IBM Plex Sans", sans-serif'
    fillText(ctx, dayLog.recap.hours_critical ? 'CRITICAL' : 'WARNING', 818, 905, 130)
  }
}

export const LogSheet = ({ trip, dayLog, dayNumber }: LogSheetProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()
  const tripEvents = dayLog.remarks.map((remark) => mapRemarkToEvent(remark.note, remark.location, remark.time))
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    renderLogSheetCanvas(canvas, trip, dayLog, dayNumber)
  }, [trip, dayLog, dayNumber])

  return (
    <div
      className={`flex min-h-full flex-col rounded-[24px] border p-3 pb-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] ${
        isDark
          ? 'border-white/10 bg-slate-950/85'
          : 'border-slate-200 bg-white'
      }`}
      id={`log-sheet-day-${dayNumber}`}
    >
      <div className="shrink-0">
        <canvas
          ref={canvasRef}
          className="h-auto w-full rounded-md border border-slate-200 bg-white"
        />
      </div>

      {tripEvents.length > 0 && (
        <div
          className={`mt-5 min-h-[340px] flex-1 overflow-auto border-t pt-5 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trip Events</p>
              <h3 className={`mt-1 text-lg font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>Day {dayNumber} activity log</h3>
            </div>
            <div className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {tripEvents.length} events
            </div>
          </div>

          <div className="space-y-3">
            {tripEvents.map((event, index) => (
              <div
                key={`${event.time}-${event.title}-${index}`}
                className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/[0.04]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${event.iconBg}`}>
                    <event.icon className={`h-5 w-5 ${event.iconColor}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{event.title}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{event.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{formatEventTime(event.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function fillText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  ctx.fillText(value, x, y, maxWidth)
}

function splitLogDate(createdAt: string, dayNumber: number): [string, string, string] {
  const baseDate = new Date(createdAt || Date.now())
  if (Number.isNaN(baseDate.getTime())) {
    return ['--', '--', '----']
  }

  baseDate.setHours(0, 0, 0, 0)
  baseDate.setDate(baseDate.getDate() + (dayNumber - 1))
  return [
    `${baseDate.getMonth() + 1}`.padStart(2, '0'),
    `${baseDate.getDate()}`.padStart(2, '0'),
    `${baseDate.getFullYear()}`,
  ]
}

function timeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

function formatEventTime(time: string): string {
  const [hourRaw, minuteRaw] = time.split(':').map(Number)
  const suffix = hourRaw >= 12 ? 'PM' : 'AM'
  const hour = hourRaw % 12 || 12
  return `${String(hour).padStart(2, '0')}:${String(minuteRaw).padStart(2, '0')} ${suffix}`
}

function mapRemarkToEvent(note: string, location: string, time: string) {
  const normalized = note.toLowerCase()

  if (normalized.includes('fuel')) {
    return {
      title: 'Fueling Stop',
      location,
      time,
      icon: Fuel,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    }
  }

  if (normalized.includes('30-min') || normalized.includes('break')) {
    return {
      title: '30-Min Rest Break',
      location,
      time,
      icon: Coffee,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
    }
  }

  if (normalized.includes('rest') || normalized.includes('off-duty')) {
    return {
      title: 'Rest Period',
      location,
      time,
      icon: BedDouble,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    }
  }

  if (normalized.includes('pickup') || normalized.includes('shipper')) {
    return {
      title: 'Pickup Stop',
      location,
      time,
      icon: MapPinned,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    }
  }

  if (normalized.includes('dropoff') || normalized.includes('delivery')) {
    return {
      title: 'Delivery Stop',
      location,
      time,
      icon: MapPinned,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
    }
  }

  return {
    title: normalized.includes('inspection') ? 'Shift Start' : 'Trip Event',
    location,
    time,
    icon: Truck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  }
}
