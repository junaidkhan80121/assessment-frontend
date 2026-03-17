import { useEffect, useRef, useCallback } from 'react'
import type { DailyLog } from '@/types/trip'

interface LogSheetProps {
  dayLog: DailyLog
  currentCycleUsed: number
  dayNumber: number
}

const STATUS_ROWS: Record<string, number> = {
  'OFF_DUTY': 0,
  'SLEEPER': 1,
  'DRIVING': 2,
  'ON_DUTY_NOT_DRIVING': 3,
}

const STATUS_LABELS = ['Off Duty', 'Sleeper Berth', 'Driving', 'On Duty (Not Driving)']

const CANVAS_WIDTH = 1056
const CANVAS_HEIGHT = 420

// Grid dimensions
const GRID_LEFT = 180
const GRID_TOP = 90
const GRID_RIGHT = CANVAS_WIDTH - 40
const GRID_BOTTOM = GRID_TOP + 200
const HOUR_WIDTH = (GRID_RIGHT - GRID_LEFT) / 24
const ROW_HEIGHT = 50

export const LogSheet = ({ dayLog, currentCycleUsed, dayNumber }: LogSheetProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawLogSheet = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for retina
    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    canvas.style.width = `${CANVAS_WIDTH}px`
    canvas.style.height = `${CANVAS_HEIGHT}px`
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // ── Header ──────────────────────────────────────────────
    ctx.fillStyle = '#1a1a2e'
    ctx.font = 'bold 16px "IBM Plex Sans", sans-serif'
    ctx.fillText(`DRIVER'S DAILY LOG`, 20, 30)

    ctx.font = '12px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#444'
    ctx.fillText(`${dayLog.date} — FMCSA Form 395.8`, 20, 50)

    // ── Totals summary bar ──────────────────────────────────
    ctx.font = '10px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#666'
    const totalsText = `OFF: ${dayLog.totals.OFF_DUTY}h | SB: ${dayLog.totals.SLEEPER}h | DR: ${dayLog.totals.DRIVING}h | ON: ${dayLog.totals.ON_DUTY_NOT_DRIVING}h`
    ctx.fillText(totalsText, 20, 70)

    // ── Row labels ──────────────────────────────────────────
    ctx.font = '11px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#333'
    STATUS_LABELS.forEach((label, i) => {
      const y = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4
      ctx.fillText(label, 20, y)
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
    for (let h = 0; h <= 24; h += 2) {
      const x = GRID_LEFT + h * HOUR_WIDTH
      ctx.fillText(h === 24 ? 'M' : h === 0 ? 'M' : h === 12 ? 'N' : String(h > 12 ? h - 12 : h), x, GRID_TOP - 5)
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
    const remarksY = GRID_BOTTOM + 20
    ctx.font = 'bold 11px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText('REMARKS:', 20, remarksY)

    ctx.font = '10px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#555'
    dayLog.remarks.forEach((remark, i) => {
      if (i > 5) return // Max 6 remarks visible
      ctx.fillText(
        `${remark.time} — ${remark.note} (${remark.location})`,
        20, remarksY + 16 + i * 14
      )
    })

    // ── Recap section ───────────────────────────────────────
    const recapX = GRID_RIGHT - 280
    const recapY = GRID_BOTTOM + 20

    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(recapX, recapY - 14, 300, 76)
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 1
    ctx.strokeRect(recapX, recapY - 14, 300, 76)

    ctx.font = 'bold 10px "IBM Plex Sans", sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText('70-HOUR / 8-DAY RECAP', recapX + 10, recapY)

    ctx.font = '10px "IBM Plex Mono", monospace'
    ctx.fillStyle = '#555'
    ctx.fillText(`A. On-duty today:        ${dayLog.recap.on_duty_today.toFixed(2)} hrs`, recapX + 10, recapY + 16)
    ctx.fillText(`B. On-duty last 8 days:  ${dayLog.recap.on_duty_last_8_days.toFixed(2)} hrs`, recapX + 10, recapY + 30)
    ctx.fillText(`C. Available tomorrow:   ${dayLog.recap.available_tomorrow.toFixed(2)} hrs`, recapX + 10, recapY + 44)

    // Warning indicator
    if (dayLog.recap.hours_critical) {
      ctx.fillStyle = '#EF4444'
      ctx.font = 'bold 10px "IBM Plex Sans", sans-serif'
      ctx.fillText('⚠ CRITICAL', recapX + 220, recapY + 44)
    } else if (dayLog.recap.hours_warning) {
      ctx.fillStyle = '#F59E0B'
      ctx.font = 'bold 10px "IBM Plex Sans", sans-serif'
      ctx.fillText('⚠ WARNING', recapX + 220, recapY + 44)
    }

  }, [dayLog, currentCycleUsed, dayNumber])

  useEffect(() => {
    drawLogSheet()
  }, [drawLogSheet])

  return (
    <div className="overflow-x-auto pb-2" id={`log-sheet-day-${dayNumber}`}>
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        className="rounded-md border border-border bg-white"
      />
    </div>
  )
}

function timeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}
