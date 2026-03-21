import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trip, DailyLog } from '@/types/trip'
import { useTheme } from 'next-themes'

interface LogSheetProps {
  trip: Trip
  dayLog: DailyLog
  dayNumber: number
}

interface RenderLogSheetOptions {
  scale?: number
}

interface TemplateField {
  x: number
  y: number
  width: number
  size: number
  weight?: string
  align?: 'left' | 'center' | 'right'
}

const STATUS_ROWS: Record<string, number> = {
  OFF_DUTY: 0,
  SLEEPER: 1,
  DRIVING: 2,
  ON_DUTY_NOT_DRIVING: 3,
}

const CANVAS_WIDTH = 1026
const CANVAS_HEIGHT = 1036

const GRAPH_X = 116
const GRAPH_Y = 276
const GRAPH_WIDTH = 790
const GRAPH_HEIGHT = 195
const GRAPH_ROW_HEIGHT = GRAPH_HEIGHT / 4

const TEMPLATE_FIELDS: Record<string, TemplateField> = {
  from: { x: 92, y: 75, width: 292, size: 10, weight: '600' },
  to: { x: 530, y: 75, width: 260, size: 10, weight: '600' },
  month: { x: 292, y: 32, width: 42, size: 10, weight: '600', align: 'center' },
  day: { x: 366, y: 32, width: 30, size: 10, weight: '600', align: 'center' },
  year: { x: 438, y: 32, width: 46, size: 10, weight: '600', align: 'center' },
  total_drive: { x: 80, y: 139, width: 86, size: 9, align: 'center' },
  total_mileage: { x: 214, y: 139, width: 86, size: 9, align: 'center' },
  carrier: { x: 623, y: 132, width: 240, size: 8, align: 'center' },
  office: { x: 623, y: 171, width: 240, size: 8, align: 'center' },
  terminal: { x: 623, y: 210, width: 240, size: 8, align: 'center' },
  vehicle: { x: 70, y: 182, width: 264, size: 8, align: 'center' },
  shipping_doc: { x: 40, y: 730, width: 100, size: 8 },
  commodity: { x: 40, y: 790, width: 95, size: 8 },
  pickup: { x: 154, y: 835, width: 122, size: 7, align: 'center' },
  dropoff: { x: 319, y: 835, width: 122, size: 7, align: 'center' },
  warning: { x: 912, y: 970, width: 58, size: 9, weight: '700', align: 'left' },
}

export async function renderLogSheetCanvas(
  canvas: HTMLCanvasElement,
  trip: Trip,
  dayLog: DailyLog,
  dayNumber: number,
  options: RenderLogSheetOptions = {},
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  const dpr = options.scale ?? (window.devicePixelRatio || 1)
  canvas.width = CANVAS_WIDTH * dpr
  canvas.height = CANVAS_HEIGHT * dpr
  canvas.style.width = '100%'
  canvas.style.height = 'auto'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.textBaseline = 'alphabetic'
  ctx.imageSmoothingEnabled = true

  drawTemplate(ctx)

  const [monthLabel, dayLabel, yearLabel] = splitLogDate(trip.created_at, dayNumber)
  const fromLabel = shortLocation(resolveLogBoundary(dayLog, trip.current_location, 'start'))
  const toLabel = shortLocation(resolveLogBoundary(dayLog, trip.dropoff_location, 'end'))
  const pickupLabel = shortLocation(trip.pickup_location)
  const officeLabel = shortLocation(trip.current_location)
  const carrierLabel = 'Generated Property Carrier Plan'
  const vehicleNumbers = `TRK-${trip.id.slice(0, 4).toUpperCase()} / TRL-${trip.id.slice(4, 8).toUpperCase()}`
  const shippingDocument = `DOC-${trip.id.slice(0, 8).toUpperCase()}`
  const shipperCommodity = `${pickupLabel} to ${toLabel}`
  const [monthDisplay, dayDisplay, yearDisplay] = formatTemplateDate(monthLabel, dayLabel, yearLabel)

  drawTemplateField(ctx, TEMPLATE_FIELDS.from, fromLabel)
  drawTemplateField(ctx, TEMPLATE_FIELDS.to, toLabel)
  drawTemplateField(ctx, TEMPLATE_FIELDS.month, monthDisplay)
  drawTemplateField(ctx, TEMPLATE_FIELDS.day, dayDisplay)
  drawTemplateField(ctx, TEMPLATE_FIELDS.year, yearDisplay)
  drawTemplateField(ctx, TEMPLATE_FIELDS.total_drive, `${Math.round(dayLog.totals.DRIVING)} hrs`)
  drawTemplateField(ctx, TEMPLATE_FIELDS.total_mileage, `${Math.round(dayLog.total_miles_driving_today)} mi`)
  drawTemplateField(ctx, TEMPLATE_FIELDS.carrier, carrierLabel)
  drawTemplateField(ctx, TEMPLATE_FIELDS.office, officeLabel)
  drawTemplateField(ctx, TEMPLATE_FIELDS.terminal, fromLabel)
  drawTemplateField(ctx, TEMPLATE_FIELDS.vehicle, vehicleNumbers)

  drawDutyLines(ctx, dayLog)
  drawRemarks(ctx, dayLog)
  drawDutyRowTotals(ctx, dayLog)

  drawTemplateField(ctx, TEMPLATE_FIELDS.shipping_doc, shippingDocument)
  drawTemplateField(ctx, TEMPLATE_FIELDS.commodity, shipperCommodity)
  drawRecapValue(ctx, 104, '', dayLog.recap.on_duty_today.toFixed(2))
  drawRecapValue(ctx, 260, 'A.', dayLog.recap.on_duty_last_8_days.toFixed(2))
  drawRecapValue(ctx, 350, 'B.', dayLog.recap.available_tomorrow_70.toFixed(2))
  drawRecapValue(ctx, 440, 'C.', dayLog.recap.on_duty_last_5_days.toFixed(2))
  drawRecapValue(ctx, 610, 'A.', dayLog.recap.on_duty_last_7_days.toFixed(2))
  drawRecapValue(ctx, 700, 'B.', dayLog.recap.available_tomorrow_60.toFixed(2))
  drawRecapValue(ctx, 790, 'C.', dayLog.recap.on_duty_last_5_days.toFixed(2))
  drawTemplateField(ctx, TEMPLATE_FIELDS.pickup, pickupLabel)
  drawTemplateField(ctx, TEMPLATE_FIELDS.dropoff, toLabel)

  if (dayLog.recap.hours_critical || dayLog.recap.hours_warning) {
    ctx.fillStyle = dayLog.recap.hours_critical ? '#dc2626' : '#d97706'
    drawTemplateField(ctx, TEMPLATE_FIELDS.warning, dayLog.recap.hours_critical ? 'CRITICAL' : 'WARNING')
    ctx.fillStyle = '#111111'
  }
}

function drawTemplate(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#111111'
  ctx.fillStyle = '#111111'

  setFont(ctx, 14, '700')
  ctx.fillText("Drivers Daily Log", 42, 36)
  setFont(ctx, 8)
  ctx.fillText('[24 hours]', 68, 57)
  ctx.fillText('(month)', 281, 24)
  ctx.fillText('(day)', 356, 24)
  ctx.fillText('(year)', 428, 24)
  drawLine(ctx, 286, 36, 330, 36, 1)
  drawLine(ctx, 358, 36, 392, 36, 1)
  drawLine(ctx, 430, 36, 484, 36, 1)
  setFont(ctx, 12, '700')
  ctx.fillText('/', 338, 35)
  ctx.fillText('/', 401, 35)
  ctx.fillText('Original - File at home terminal.', 604, 23)
  ctx.fillText("Duplicate - Driver retains in his/her possession for 8 days.", 604, 36)

  drawLabeledLine(ctx, 'From:', 40, 81, 196)
  drawLabeledLine(ctx, 'To:', 475, 81, 195)

  drawBox(ctx, 44, 115, 135, 48)
  drawBox(ctx, 184, 115, 135, 48)
  drawBox(ctx, 44, 169, 275, 50)

  drawRightField(ctx, 470, 115, 365, 'Name of Carrier or Carriers')
  drawRightField(ctx, 470, 153, 365, 'Main Office Address')
  drawRightField(ctx, 470, 193, 365, 'Home Terminal Address')

  setFont(ctx, 8, '600')
  ctx.fillText('Total Miles Driving Today', 56, 155)
  ctx.fillText('Total Mileage Today', 194, 155)
  ctx.fillText('Truck/Tractor and Trailer Numbers or', 115, 205)
  ctx.fillText('License Plate(s)/State (show each unit)', 97, 217)

  drawGraphTemplate(ctx)
  drawRemarksTemplate(ctx)
  drawRecapTemplate(ctx)
}

function drawGraphTemplate(ctx: CanvasRenderingContext2D) {
  ctx.fillRect(95, 247, 886, 28)
  setFont(ctx, 8, '600')
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Mid-', 103, 260)
  ctx.fillText('night', 101, 270)
  ctx.fillText('Mid-', 872, 260)
  ctx.fillText('night', 870, 270)
  ctx.fillText('Total', 938, 260)
  ctx.fillText('Hours', 936, 270)
  ctx.fillText('Noon', 500, 270)

  for (let hour = 1; hour <= 11; hour += 1) {
    ctx.fillText(String(hour), GRAPH_X + hour * (GRAPH_WIDTH / 24) - 4, 269)
    ctx.fillText(String(hour), GRAPH_X + (hour + 12) * (GRAPH_WIDTH / 24) - 4, 269)
  }

  ctx.fillStyle = '#111111'
  setFont(ctx, 10, '600')
  const labels = [
    '1. Off Duty',
    '2. Sleeper',
    'Berth',
    '3. Driving',
    '4. On Duty',
    '(not driving)',
  ]
  ctx.fillText(labels[0], 28, GRAPH_Y + 28)
  ctx.fillText(labels[1], 28, GRAPH_Y + 71)
  ctx.fillText(labels[2], 28, GRAPH_Y + 84)
  ctx.fillText(labels[3], 28, GRAPH_Y + 123)
  ctx.fillText(labels[4], 28, GRAPH_Y + 167)
  ctx.fillText(labels[5], 28, GRAPH_Y + 180)

  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 1
  ctx.strokeRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

  for (let row = 1; row < 4; row += 1) {
    const y = GRAPH_Y + row * GRAPH_ROW_HEIGHT
    drawLine(ctx, GRAPH_X, y, GRAPH_X + GRAPH_WIDTH, y, 1)
  }

  const hourWidth = GRAPH_WIDTH / 24
  for (let hour = 0; hour <= 24; hour += 1) {
    const x = GRAPH_X + hour * hourWidth
    drawLine(ctx, x, GRAPH_Y, x, GRAPH_Y + GRAPH_HEIGHT, hour % 6 === 0 ? 1.2 : 0.8)
  }

  for (let quarter = 0; quarter < 24 * 4; quarter += 1) {
    const x = GRAPH_X + quarter * (GRAPH_WIDTH / (24 * 4))
    const tickHeight = quarter % 4 === 0 ? 18 : quarter % 2 === 0 ? 12 : 7
    for (let row = 0; row < 4; row += 1) {
      const isTopDown = row < 2
      const baseY = GRAPH_Y + (isTopDown ? row : row + 1) * GRAPH_ROW_HEIGHT
      const endY = isTopDown ? baseY + tickHeight : baseY - tickHeight
      drawLine(ctx, x, baseY, x, endY, 0.7)
    }
  }

  const totalHoursLineX1 = 928
  const totalHoursLineX2 = 980
  for (let i = 0; i < 4; i += 1) {
    const y = GRAPH_Y + GRAPH_ROW_HEIGHT * (i + 1)
    drawLine(ctx, totalHoursLineX1, y, totalHoursLineX2, y, 1.2)
  }
  drawLine(ctx, totalHoursLineX1, GRAPH_Y + GRAPH_HEIGHT + 37, totalHoursLineX2, GRAPH_Y + GRAPH_HEIGHT + 37, 1.2)
}

function drawRemarksTemplate(ctx: CanvasRenderingContext2D) {
  setFont(ctx, 11, '700')
  ctx.fillText('Remarks', 38, 522)
  drawLine(ctx, 33, 534, 33, 836, 2.2)
  drawLine(ctx, 33, 836, 452, 836, 2.2)

  setFont(ctx, 10, '700')
  ctx.fillText('Shipping', 38, 610)
  ctx.fillText('Documents:', 38, 624)
  drawLine(ctx, 35, 636, 145, 636, 1)
  setFont(ctx, 8, '600')
  ctx.fillText('DVL or Manifest No.', 40, 675)
  ctx.fillText('or', 40, 689)
  drawLine(ctx, 35, 699, 145, 699, 1)
  ctx.fillText('Shipper & Commodity', 38, 760)
  drawLine(ctx, 35, 771, 145, 771, 1)

  setFont(ctx, 8)
  ctx.fillText('Enter name of place you reported and where released from work and when and where each change of duty occurred.', 143, 804)
  ctx.fillText('Use time standard of home terminal.', 392, 821)
}

function drawRecapTemplate(ctx: CanvasRenderingContext2D) {
  drawLine(ctx, 40, 888, 332, 888, 2.2)
  drawLine(ctx, 390, 888, 684, 888, 2.2)
  drawLine(ctx, 742, 888, 994, 888, 2.2)

  setFont(ctx, 9, '700')
  ctx.fillText('Recap:', 18, 916)
  setFont(ctx, 8, '600')
  ctx.fillText('Complete at', 18, 928)
  ctx.fillText('end of day', 18, 940)

  setFont(ctx, 9, '700')
  ctx.fillText('70 Hour/', 185, 916)
  ctx.fillText('8 Day', 185, 928)
  ctx.fillText('Drivers', 185, 940)

  ctx.fillText('60 Hour/ 7', 525, 916)
  ctx.fillText('Day Drivers', 525, 928)

  ctx.fillText('*If you took', 896, 916)
  ctx.fillText('34', 896, 928)
  setFont(ctx, 8, '600')
  const warningTextX = 896
  ctx.fillText('consecutive', warningTextX, 940)
  ctx.fillText('hours off', warningTextX, 952)
  ctx.fillText('duty you', warningTextX, 964)
  ctx.fillText('have 60/70', warningTextX, 976)
  ctx.fillText('hours', warningTextX, 988)
  ctx.fillText('available', warningTextX, 1000)

  const recapColumns = [
    { x: 104, header: '', body: ['On duty', 'hours', 'today,', 'Total lines', '3 & 4'] },
    { x: 260, header: 'A.', body: ['A. Total', 'hours on', 'duty last 7', 'days', 'including', 'today.'] },
    { x: 350, header: 'B.', body: ['B. Total', 'hours', 'available', 'tomorrow', '70 hr.', 'minus A*'] },
    { x: 440, header: 'C.', body: ['C. Total', 'hours on', 'duty last 5', 'days', 'including', 'today.'] },
    { x: 610, header: 'A.', body: ['A. Total', 'hours on', 'duty last 8', 'days', 'including', 'today.'] },
    { x: 700, header: 'B.', body: ['B. Total', 'hours', 'available', 'tomorrow', '60 hr.', 'minus A*'] },
    { x: 790, header: 'C.', body: ['C. Total', 'hours on', 'duty last 7', 'days', 'including', 'today.'] },
  ]

  setFont(ctx, 8, '600')
  for (const column of recapColumns) {
    if (column.header) {
      ctx.fillText(column.header, column.x, 940)
      drawLine(ctx, column.x - 2, 946, column.x + 48, 946, 1)
    } else {
      drawLine(ctx, column.x - 4, 946, column.x + 48, 946, 1)
    }

    column.body.forEach((line, index) => {
      ctx.fillText(line, column.x, 958 + index * 12)
    })
  }
}

function drawDutyLines(ctx: CanvasRenderingContext2D, dayLog: DailyLog) {
  const entries = dayLog.duty_entries
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 2.2

  entries.forEach((entry) => {
    const row = STATUS_ROWS[entry.status]
    if (row === undefined) {
      return
    }

    const startMin = timeToMinutes(entry.start)
    const endMin = timeToMinutes(entry.end)
    const x1 = GRAPH_X + (startMin / 1440) * GRAPH_WIDTH
    const x2 = GRAPH_X + (endMin / 1440) * GRAPH_WIDTH
    const y = GRAPH_Y + row * GRAPH_ROW_HEIGHT + GRAPH_ROW_HEIGHT / 2

    ctx.beginPath()
    ctx.moveTo(x1, y)
    ctx.lineTo(x2, y)
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
    const x = GRAPH_X + (transitionMin / 1440) * GRAPH_WIDTH
    const y1 = GRAPH_Y + currentRow * GRAPH_ROW_HEIGHT + GRAPH_ROW_HEIGHT / 2
    const y2 = GRAPH_Y + nextRow * GRAPH_ROW_HEIGHT + GRAPH_ROW_HEIGHT / 2
    ctx.beginPath()
    ctx.moveTo(x, y1)
    ctx.lineTo(x, y2)
    ctx.stroke()
  }
}

function drawRemarks(ctx: CanvasRenderingContext2D, dayLog: DailyLog) {
  const lines = dayLog.remarks
    .slice(0, 4)
    .map((remark) => `${remark.time} ${shortRemarkText(remark.note, remark.location)}`)

  drawWrappedText(ctx, lines, 40, 554, 396, 8, 15, 8)
}

function drawDutyRowTotals(ctx: CanvasRenderingContext2D, dayLog: DailyLog) {
  const rightEdge = 980
  const lineWidth = 52
  const textBaselineOffset = 5
  const rows = [
    { value: dayLog.totals.OFF_DUTY.toFixed(2), y: GRAPH_Y + GRAPH_ROW_HEIGHT * 1 },
    { value: dayLog.totals.SLEEPER.toFixed(2), y: GRAPH_Y + GRAPH_ROW_HEIGHT * 2 },
    { value: dayLog.totals.DRIVING.toFixed(2), y: GRAPH_Y + GRAPH_ROW_HEIGHT * 3 },
    { value: dayLog.totals.ON_DUTY_NOT_DRIVING.toFixed(2), y: GRAPH_Y + GRAPH_ROW_HEIGHT * 4 },
  ]

  rows.forEach(({ value, y }) => {
    fillTextFitted(ctx, value, rightEdge - lineWidth, y - textBaselineOffset, lineWidth, 8, '600', 'right')
  })
}

export const LogSheet = ({ trip, dayLog, dayNumber }: LogSheetProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stateRef = useRef({ scale: 1, position: { x: 0, y: 0 } });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    stateRef.current = { scale, position };
  }, [scale, position]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialScale = Math.min((container.clientWidth - 32) / CANVAS_WIDTH, (container.clientHeight - 32) / CANVAS_HEIGHT, 1);
    const startX = (container.clientWidth - CANVAS_WIDTH * initialScale) / 2;
    const startY = (container.clientHeight - CANVAS_HEIGHT * initialScale) / 2;

    const initialState = { scale: initialScale, position: { x: startX, y: startY } };
    setScale(initialState.scale);
    setPosition(initialState.position);
    stateRef.current = initialState;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { scale: currentScale, position: currentPos } = stateRef.current;
      
      const delta = e.deltaY * -0.002;
      const newScale = Math.min(Math.max(0.1, currentScale * Math.exp(delta)), 10);

      const rect = container.getBoundingClientRect();
      const ptrX = e.clientX - rect.left;
      const ptrY = e.clientY - rect.top;

      const ratio = 1 - newScale / currentScale;
      const newPosition = {
        x: currentPos.x + (ptrX - currentPos.x) * ratio,
        y: currentPos.y + (ptrY - currentPos.y) * ratio,
      };

      stateRef.current = { scale: newScale, position: newPosition }; 
      setScale(newScale);
      setPosition(newPosition);
    };

    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => container.removeEventListener('wheel', handleWheel, true);
    // Re-attach when fullscreen toggles: portaling replaces the DOM node, so the old
    // listener is removed with the unmounted element and must bind to the new container.
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    setTimeout(resetView, 10);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Don't start panning when interacting with toolbar / buttons — pointerdown bubbles
    // from buttons before click; without this, setPointerCapture steals the gesture and
    // Full Screen / Reset never fire reliably.
    const target = e.target as HTMLElement | null
    if (target?.closest('button, a, input, textarea, select, [role="button"]')) {
      return
    }
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const resetView = () => {
    const container = containerRef.current;
    if (!container) return;
    const initialScale = Math.min((container.clientWidth - 32) / CANVAS_WIDTH, (container.clientHeight - 32) / CANVAS_HEIGHT, 1);
    const startX = (container.clientWidth - CANVAS_WIDTH * initialScale) / 2;
    const startY = (container.clientHeight - CANVAS_HEIGHT * initialScale) / 2;
    setScale(initialScale);
    setPosition({ x: startX, y: startY });
  };

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    renderLogSheetCanvas(canvas, trip, dayLog, dayNumber, { scale: 2 })
  }, [trip, dayLog, dayNumber, isFullscreen, isDark])

  const logSheetContent = (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? `fixed inset-0 z-[99999] w-screen h-screen flex flex-col overflow-hidden p-4 sm:p-8 cursor-grab active:cursor-grabbing select-none backdrop-blur-md ${
              isDark ? 'bg-slate-950/95 text-white' : 'bg-slate-200/90 text-slate-900'
            }`
          : `relative w-full h-full min-h-[500px] flex-1 overflow-hidden sm:rounded-[20px] rounded-none cursor-grab active:cursor-grabbing select-none ${
              isDark ? 'bg-slate-950/85' : 'bg-slate-50'
            }`
      }
      id={`log-sheet-day-${dayNumber}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div 
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
          transformOrigin: '0 0',
          width: `${CANVAS_WIDTH}px`, 
          height: `${CANVAS_HEIGHT}px` 
        }} 
        className="flex-shrink-0 absolute top-0 left-0"
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full bg-white shadow-xl pointer-events-none"
          style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
        />
      </div>

      <div
        className="absolute top-3 right-3 z-10 flex justify-end items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-800/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-semibold text-slate-200 border border-slate-700 shadow-md uppercase tracking-wider hidden sm:block">
          Scroll: Zoom • Drag: Pan
        </div>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className="bg-slate-900/95 backdrop-blur-md hover:bg-slate-800 text-white transition-colors cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold shadow-md border border-slate-700"
        >
          {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
        </button>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); resetView(); }}
          className="bg-slate-900/95 backdrop-blur-md hover:bg-slate-800 text-white transition-colors cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold shadow-md border border-slate-700"
        >
          Reset View
        </button>
      </div>
    </div>
  );

  return isFullscreen && typeof document !== 'undefined'
    ? createPortal(logSheetContent, document.body)
    : logSheetContent;
}

function drawLabeledLine(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, width: number) {
  setFont(ctx, 11, '700')
  ctx.fillText(label, x, y)
  drawLine(ctx, x + 44, y - 4, x + 44 + width, y - 4, 1.2)
}

function drawRightField(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, label: string) {
  drawLine(ctx, x, y + 18, x + width, y + 18, 1.2)
  setFont(ctx, 8, '600')
  ctx.fillText(label, x + width / 2 - ctx.measureText(label).width / 2, y + 32)
}

function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.lineWidth = 1.2
  ctx.strokeRect(x, y, width, height)
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number) {
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawTextLine(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, width: number) {
  fillTextFitted(ctx, value, x, y - 6, width, 10, '600')
}

function drawTemplateField(ctx: CanvasRenderingContext2D, field: TemplateField, value: string) {
  fillTextFitted(
    ctx,
    value,
    field.x,
    field.y,
    field.width,
    field.size,
    field.weight ?? '400',
    field.align ?? 'left',
  )
}

function drawMultiline(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fontSize: number,
) {
  setFont(ctx, fontSize, '600')
  value.split('\n').forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight, maxWidth)
  })
}

function drawRecapValue(
  ctx: CanvasRenderingContext2D,
  headerX: number,
  header: string,
  value: string,
) {
  setFont(ctx, 8, '600')

  if (!header) {
    ctx.fillText(value, headerX - 2, 940)
    drawLine(ctx, headerX - 4, 946, headerX + 48, 946, 1)
    return
  }

  ctx.fillText(header, headerX, 940)
  const headerWidth = ctx.measureText(header).width
  const valueX = headerX + headerWidth + 12
  ctx.fillText(value, valueX, 940)
  drawLine(ctx, headerX - 2, 946, headerX + 48, 946, 1)
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight = '400') {
  ctx.font = `${weight} ${size}px "IBM Plex Sans", sans-serif`
}

function fillTextFitted(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  startSize: number,
  weight = '400',
  align: 'left' | 'center' | 'right' = 'left',
) {
  let fontSize = startSize
  const text = value.trim()

  while (fontSize > 5.5) {
    setFont(ctx, fontSize, weight)
    if (ctx.measureText(text).width <= maxWidth) {
      drawAlignedText(ctx, text, x, y, maxWidth, align)
      return
    }
    fontSize -= 0.5
  }

  setFont(ctx, 5.5, weight)
  drawAlignedText(ctx, truncateToWidth(ctx, text, maxWidth), x, y, maxWidth, align)
}

function drawAlignedText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  align: 'left' | 'center' | 'right',
) {
  if (align === 'center') {
    const width = ctx.measureText(value).width
    const startX = x + Math.max((maxWidth - width) / 2, 0)
    ctx.fillText(value, startX, y, maxWidth)
    return
  }

  if (align === 'right') {
    const width = ctx.measureText(value).width
    const startX = x + Math.max(maxWidth - width, 0)
    ctx.fillText(value, startX, y, maxWidth)
    return
  }

  ctx.fillText(value, x, y, maxWidth)
}

function truncateToWidth(ctx: CanvasRenderingContext2D, value: string, maxWidth: number) {
  if (ctx.measureText(value).width <= maxWidth) {
    return value
  }

  let result = value
  while (result.length > 1 && ctx.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1)
  }
  return `${result}...`
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
  maxLines: number,
) {
  setFont(ctx, fontSize)
  let currentY = y
  let writtenLines = 0

  for (const line of lines) {
    const words = line.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        ctx.fillText(currentLine, x, currentY, maxWidth)
        currentLine = word
        currentY += lineHeight
        writtenLines += 1
        if (writtenLines >= maxLines) {
          return
        }
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      ctx.fillText(currentLine, x, currentY, maxWidth)
      currentY += lineHeight
      writtenLines += 1
      if (writtenLines >= maxLines) {
        return
      }
    }
  }
}

function shortLocation(value: string) {
  const trimmed = value.trim()
  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`
  }
  return trimmed
}

function shortRemarkText(note: string, location: string) {
  const raw = `${note} - ${shortLocation(location)}`
  return raw.length > 70 ? `${raw.slice(0, 67)}...` : raw
}

function resolveLogBoundary(dayLog: DailyLog, fallback: string, boundary: 'start' | 'end') {
  const remarks = dayLog.remarks.filter((remark) => remark.location?.trim())
  if (remarks.length === 0) {
    return fallback
  }

  const remark = boundary === 'start' ? remarks[0] : remarks[remarks.length - 1]
  return remark.location || fallback
}

function formatTemplateDate(month: string, day: string, year: string) {
  return [month.padStart(2, '0'), day.padStart(2, '0'), year.slice(-2).padStart(2, '0')]
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
