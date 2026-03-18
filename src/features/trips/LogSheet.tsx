import { useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { BedDouble, Coffee, Fuel, MapPinned, Truck } from 'lucide-react'
import type { DailyLog, Trip } from '@/types/trip'

interface LogSheetProps {
  trip: Trip
  dayLog: DailyLog
  dayNumber: number
}

const STATUS_ROWS: Record<string, number> = {
  'OFF_DUTY': 0,
  'SLEEPER': 1,
  'DRIVING': 2,
  'ON_DUTY_NOT_DRIVING': 3,
}

const STATUS_LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty (Not Driving)']

const CANVAS_WIDTH = 1180
const CANVAS_HEIGHT = 700

// Grid dimensions
const GRID_LEFT = 170
const GRID_TOP = 150
const GRID_RIGHT = CANVAS_WIDTH - 80
const GRID_BOTTOM = GRID_TOP + 220
const HOUR_WIDTH = (GRID_RIGHT - GRID_LEFT) / 24
const ROW_HEIGHT = 55

export const LogSheet = ({ trip, dayLog, dayNumber }: LogSheetProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()
  const tripEvents = dayLog.remarks.map((remark) => mapRemarkToEvent(remark.note, remark.location, remark.time))
  const isDark = resolvedTheme === 'dark'

  const drawLogSheet = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for retina
    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    canvas.style.width = '100%'
    canvas.style.height = 'auto'
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const carrierName = 'Vanguard Fleet Ops'
    const mainOffice = 'Chicago, IL'
    const vehicleNumbers = `TRK-${trip.id.slice(0, 4).toUpperCase()} / TRL-${trip.id.slice(4, 8).toUpperCase()}`
    const shippingDocument = `DOC-${trip.id.slice(0, 8).toUpperCase()}`
    const shipperCommodity = `${trip.pickup_location} to ${trip.dropoff_location}`
    const generatedDriver = 'Assigned Driver'
    const totalHours = (
      dayLog.totals.OFF_DUTY +
      dayLog.totals.SLEEPER +
      dayLog.totals.DRIVING +
      dayLog.totals.ON_DUTY_NOT_DRIVING
    ).toFixed(2)
    const [monthLabel, dayLabel, yearLabel] = splitLogDate(dayLog.date, dayNumber)

    drawBox(ctx, 20, 16, CANVAS_WIDTH - 40, 114)
    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 22px "IBM Plex Sans", sans-serif'
    ctx.fillText("DRIVER'S DAILY LOG", 30, 42)
    ctx.font = '11px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#475569'
    ctx.fillText('24-hour record of duty status generated from trip plan data', 30, 60)

    drawLabeledValue(ctx, 30, 78, 90, 'Month', monthLabel)
    drawLabeledValue(ctx, 130, 78, 70, 'Day', dayLabel)
    drawLabeledValue(ctx, 210, 78, 90, 'Year', yearLabel)
    drawLabeledValue(ctx, 320, 78, 150, 'Miles Today', `${Math.round(dayLog.total_miles_driving_today)} mi`)
    drawLabeledValue(ctx, 480, 78, 250, 'Carrier', carrierName)
    drawLabeledValue(ctx, 740, 78, 220, 'Vehicle Numbers', vehicleNumbers)

    drawLabeledValue(ctx, 30, 106, 340, 'Home Terminal', trip.current_location)
    drawLabeledValue(ctx, 380, 106, 250, 'Main Office Address', mainOffice)
    drawLabeledValue(ctx, 640, 106, 170, 'Driver', generatedDriver)
    drawLabeledValue(ctx, 820, 106, 140, 'Co-Driver', 'None')
    drawLabeledValue(ctx, 970, 106, 160, 'Time Base', 'Home terminal')

    // ── Row labels ──────────────────────────────────────────
    ctx.font = '11px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#333'
    STATUS_LABELS.forEach((label, i) => {
      const y = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4
      ctx.fillText(label, 24, y)
    })

    // ── Grid lines ──────────────────────────────────────────
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 0.5

    // Horizontal lines (row boundaries)
    for (let i = 0; i <= 4; i++) {
      const y = GRID_TOP + i * ROW_HEIGHT
      ctx.beginPath()
      ctx.moveTo(GRID_LEFT, y)
      ctx.lineTo(GRID_RIGHT, y)
      ctx.stroke()
    }

    // Vertical hour lines
    for (let h = 0; h <= 24; h++) {
      const x = GRID_LEFT + h * HOUR_WIDTH
      ctx.beginPath()
      ctx.moveTo(x, GRID_TOP)
      ctx.lineTo(x, GRID_BOTTOM)

      if (h % 6 === 0) {
        ctx.lineWidth = 1
        ctx.strokeStyle = '#999'
      } else {
        ctx.lineWidth = 0.5
        ctx.strokeStyle = '#ddd'
      }
      ctx.stroke()
    }

    // Hour labels
    ctx.font = '9px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#666'
    ctx.textAlign = 'center'
    for (let h = 0; h <= 24; h += 1) {
      const x = GRID_LEFT + h * HOUR_WIDTH
      const label = h === 24 ? 'M' : h === 0 ? 'M' : h === 12 ? 'N' : String(h > 12 ? h - 12 : h)
      ctx.fillText(label, x, GRID_TOP - 8)
    }
    ctx.textAlign = 'left'

    // ── Draw duty status lines ──────────────────────────────
    const entries = dayLog.duty_entries

    entries.forEach((entry) => {
      const row = STATUS_ROWS[entry.status]
      if (row === undefined) return

      const startMin = timeToMinutes(entry.start)
      const endMin = timeToMinutes(entry.end)

      const x1 = GRID_LEFT + (startMin / 1440) * (GRID_RIGHT - GRID_LEFT)
      const x2 = GRID_LEFT + (endMin / 1440) * (GRID_RIGHT - GRID_LEFT)
      const y = GRID_TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2

      // Draw horizontal line for the status duration
      ctx.beginPath()
      ctx.moveTo(x1, y)
      ctx.lineTo(x2, y)
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 2.5
      ctx.stroke()
    })

    // Draw vertical transition lines between consecutive entries
    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i]
      const next = entries[i + 1]

      const currentRow = STATUS_ROWS[current.status]
      const nextRow = STATUS_ROWS[next.status]
      if (currentRow === undefined || nextRow === undefined) continue
      if (currentRow === nextRow) continue

      const transitionMin = timeToMinutes(current.end)
      const x = GRID_LEFT + (transitionMin / 1440) * (GRID_RIGHT - GRID_LEFT)
      const y1 = GRID_TOP + currentRow * ROW_HEIGHT + ROW_HEIGHT / 2
      const y2 = GRID_TOP + nextRow * ROW_HEIGHT + ROW_HEIGHT / 2

      ctx.beginPath()
      ctx.moveTo(x, y1)
      ctx.lineTo(x, y2)
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 2.5
      ctx.stroke()
    }

    // ── Remarks ─────────────────────────────────────────────
    const remarksY = GRID_BOTTOM + 30
    ctx.font = 'bold 11px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText('REMARKS:', 20, remarksY)

    ctx.font = '10px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#555'
    ctx.strokeStyle = '#d1d5db'
    ctx.strokeRect(20, remarksY + 8, 700, 160)
    dayLog.remarks.forEach((remark, i) => {
      if (i > 8) return
      ctx.fillText(
        `${remark.time} — ${remark.note} (${remark.location})`,
        30, remarksY + 28 + i * 16
      )
    })

    ctx.font = 'bold 10px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#334155'
    ctx.fillText('Shipping Documents:', 20, remarksY + 188)
    ctx.fillText('Shipper & Commodity:', 20, remarksY + 210)
    ctx.font = '10px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#0f172a'
    ctx.fillText(shippingDocument, 140, remarksY + 188)
    ctx.fillText(shipperCommodity, 140, remarksY + 210)

    // ── Recap section ───────────────────────────────────────
    const recapX = 750
    const recapY = GRID_BOTTOM + 30

    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(recapX, recapY - 14, 350, 120)
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 1
    ctx.strokeRect(recapX, recapY - 14, 350, 120)

    ctx.font = 'bold 10px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText('70-HOUR / 8-DAY RECAP', recapX + 10, recapY)

    ctx.font = '10px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#555'
    ctx.fillText(`A. On-duty today:        ${dayLog.recap.on_duty_today.toFixed(2)} hrs`, recapX + 10, recapY + 16)
    ctx.fillText(`B. On-duty last 8 days:  ${dayLog.recap.on_duty_last_8_days.toFixed(2)} hrs`, recapX + 10, recapY + 30)
    ctx.fillText(`C. Available tomorrow:   ${dayLog.recap.available_tomorrow.toFixed(2)} hrs`, recapX + 10, recapY + 44)
    ctx.fillText(`Current cycle used:      ${trip.current_cycle_used.toFixed(2)} hrs`, recapX + 10, recapY + 58)
    ctx.fillText(`Weekly remaining:        ${trip.weekly_hours_remaining.toFixed(2)} hrs`, recapX + 10, recapY + 72)

    // Warning indicator
    if (dayLog.recap.hours_critical) {
      ctx.fillStyle = '#EF4444'
      ctx.font = 'bold 10px "IBM Plex Sans", sans-serif'
      ctx.fillText('CRITICAL', recapX + 260, recapY + 72)
    } else if (dayLog.recap.hours_warning) {
      ctx.fillStyle = '#F59E0B'
      ctx.font = 'bold 10px "IBM Plex Sans", sans-serif'
      ctx.fillText('WARNING', recapX + 260, recapY + 72)
    }

    // ── Totals / certification section ──────────────────────
    const totalsY = CANVAS_HEIGHT - 82
    drawBox(ctx, 20, totalsY - 24, CANVAS_WIDTH - 40, 66)
    ctx.font = 'bold 11px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#0F172A'
    ctx.fillText('Totals', 30, totalsY - 2)
    ctx.font = '10px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#334155'
    ctx.fillText(`OFF ${dayLog.totals.OFF_DUTY.toFixed(2)}  |  SB ${dayLog.totals.SLEEPER.toFixed(2)}  |  DR ${dayLog.totals.DRIVING.toFixed(2)}  |  ON ${dayLog.totals.ON_DUTY_NOT_DRIVING.toFixed(2)}  |  TOTAL ${totalHours}`, 30, totalsY + 18)
    ctx.fillText(`I certify these entries are true and correct: ${generatedDriver}`, 30, totalsY + 40)
    ctx.fillText(`Pickup ${trip.pickup_location}  ->  Dropoff ${trip.dropoff_location}`, 610, totalsY + 18)
    ctx.fillText(`Route distance ${trip.total_distance_miles.toFixed(1)} mi`, 610, totalsY + 40)

  }, [dayLog, dayNumber, trip])

  useEffect(() => {
    drawLogSheet()
  }, [drawLogSheet])

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

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, width, height)
}

function drawLabeledValue(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string
) {
  ctx.font = '9px "IBM Plex Sans", sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText(label.toUpperCase(), x, y)
  ctx.strokeStyle = '#94a3b8'
  ctx.beginPath()
  ctx.moveTo(x, y + 16)
  ctx.lineTo(x + width, y + 16)
  ctx.stroke()
  ctx.font = '11px "IBM Plex Sans", sans-serif'
  ctx.fillStyle = '#0f172a'
  ctx.fillText(value, x, y + 12)
}

function splitLogDate(dateLabel: string, dayNumber: number): [string, string, string] {
  const baseDate = new Date()
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
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
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
