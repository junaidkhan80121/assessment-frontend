import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, RotateCw } from 'lucide-react'
import { useTheme } from 'next-themes'
 
import { useCreateTripMutation, useGetTripQuery } from '@/api/tripsApi'
import { StatsBar } from './StatsBar'
import { TripMap } from './TripMap'
import { LogSheet, renderLogSheetCanvas } from './LogSheet'
import { TripLoadingScreen } from '@/components/TripLoadingScreen'
import { jsPDF } from 'jspdf'
import type { ApiErrorResponse, RouteInstruction } from '@/types/trip'

export const TripResults = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const hasInitializedTheme = useRef(false)
  const [activeTab, setActiveTab] = useState(0)
  const [pollingInterval, setPollingInterval] = useState(5000)
  const [createTrip, { isLoading: isRecalculating }] = useCreateTripMutation()

  const { data: trip, isLoading, isError, error } = useGetTripQuery(tripId || '', {
    skip: !tripId,
    pollingInterval,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  useEffect(() => {
    if (!hasInitializedTheme.current && resolvedTheme !== 'dark') {
      setTheme('dark')
      hasInitializedTheme.current = true
      return
    }

    hasInitializedTheme.current = true
  }, [resolvedTheme, setTheme])

  useEffect(() => {
    if (trip?.status === 'COMPUTING' || trip?.status === 'PENDING') {
      setPollingInterval(5000)
      return
    }

    if (trip?.status === 'COMPUTED' || trip?.status === 'FAILED') {
      setPollingInterval(0)
    }
  }, [trip?.status])

  if (isLoading) {
    return <TripLoadingScreen />
  }

  if (trip?.status === 'COMPUTING' || trip?.status === 'PENDING') {
    return <TripLoadingScreen />
  }

  if (!trip || isError || trip.status === 'FAILED') {
    const apiError = (error as { data?: ApiErrorResponse } | undefined)?.data
    const errorMessage =
      trip?.error_message ||
      apiError?.message ||
      apiError?.error ||
      'The requested trip could not be loaded.'
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/5 max-w-md text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Trip Failed</h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const routeInstructions = trip.route_instructions ?? []

  const handleDownloadPDF = async () => {
    if (!trip.daily_logs.length) {
      return
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 24
    const imgWidth = pageWidth - margin * 2

    for (const [index, log] of trip.daily_logs.entries()) {
      const offscreenCanvas = document.createElement('canvas')
      await renderLogSheetCanvas(offscreenCanvas, trip, log, log.day_number)

      const imgData = offscreenCanvas.toDataURL('image/png')
      const imgHeight = (offscreenCanvas.height / offscreenCanvas.width) * imgWidth

      if (index > 0) {
        pdf.addPage()
      }

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin,
        imgWidth,
        Math.min(imgHeight, pageHeight - margin * 2),
      )
    }

    pdf.save(`eld-trip-${tripId}-logs.pdf`)
  }

  const handleRecalculateRoute = async () => {
    if (!trip) {
      return
    }

    const nextTrip = await createTrip({
      current_location: trip.current_location,
      current_location_lat: trip.current_location_lat,
      current_location_lon: trip.current_location_lon,
      pickup_location: trip.pickup_location,
      pickup_location_lat: trip.pickup_location_lat,
      pickup_location_lon: trip.pickup_location_lon,
      dropoff_location: trip.dropoff_location,
      dropoff_location_lat: trip.dropoff_location_lat,
      dropoff_location_lon: trip.dropoff_location_lon,
      current_cycle_used: trip.current_cycle_used,
    }).unwrap()

    navigate(`/trip/${nextTrip.id}`)
  }

  return (
    <div className="relative z-10 min-h-screen px-4 pb-12 pt-28 sm:px-6 sm:pt-28 lg:px-8 xl:pb-12">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        
        {/* --- HEADER --- */}
        <section className="rounded-[24px] border border-outline-variant/30 bg-surface/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:px-4 sm:py-3 shrink-0">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/')}
                className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container"
                id="back-button"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Trip Results</p>
                <p className="mt-0.5 max-w-4xl text-sm text-muted-foreground">
                  {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}
                </p>
              </div>
            </div>

            <button
              onClick={handleRecalculateRoute}
              disabled={isRecalculating}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition-all hover:scale-[1.02] hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              Recalculate Route
            </button>
          </div>

          <div className="mt-2.5">
            <StatsBar trip={trip} />
          </div>
        </section>

        {/* --- MAP SECTION (Max Space) --- */}
        <section className="flex flex-col rounded-[28px] border border-outline-variant/30 bg-surface/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 px-1 shrink-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Route Map</p>
              <h2 className="mt-1 text-xl font-bold text-on-surface">Primary route and alternatives</h2>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Fullscreen, alternate tiles, interactive markers</p>
          </div>
          <div className="h-[55vh] min-h-[480px] w-full overflow-hidden rounded-[24px] border border-outline-variant/25 bg-card">
            <TripMap trip={trip} />
          </div>
        </section>

        {/* --- DETAILS GRID (Instructions + Logs) --- */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] items-start">
          
          {/* Left Column (Instructions & Stops) */}
          <div className="flex flex-col gap-4">
            <div className="rounded-[28px] border border-outline-variant/30 bg-surface/88 p-4 sm:p-5 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Route Instructions</p>
                  <h3 className="mt-1 text-lg font-bold text-on-surface">Turn-by-turn guidance</h3>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary shadow-[0_0_15px_rgba(0,255,163,0.15)]">
                  {routeInstructions.length} steps
                </div>
              </div>
              <div className="max-h-[380px] space-y-3 overflow-y-auto pr-2 fancy-scrollbar">
                {routeInstructions.map((instruction, index) => (
                  <div
                    key={`${instruction.text}-${index}`}
                    className="rounded-2xl border border-outline-variant/20 bg-surface px-4 py-3.5 transition-colors hover:bg-surface-container"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-[0_0_10px_rgba(0,255,163,0.2)]">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface leading-snug">{instruction.text}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-primary/50" />
                          {formatInstructionMeta(instruction)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {routeInstructions.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
                    Route steps were not available for this trip record.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-outline-variant/30 bg-surface/88 p-4 sm:p-5 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Stops & Rest</p>
              <h3 className="mt-1 text-lg font-bold text-on-surface">Trip stop summary</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {trip.stops.map((stop, index) => (
                  <div
                    key={`${stop.type}-${stop.arrival_hour}-${index}`}
                    className="rounded-[20px] border border-outline-variant/20 bg-surface px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-bold tracking-wide text-on-surface">{formatStopType(stop.type)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{stop.location}</p>
                      </div>
                      <div className="text-right text-[11px] font-medium text-muted-foreground shrink-0 rounded-lg bg-surface-container-low px-2 py-1">
                        <p className="text-on-surface">{formatArrivalHour(stop.arrival_hour)}</p>
                        <p>{stop.duration_minutes} min</p>
                      </div>
                    </div>
                    <p className="mt-3 border-t border-outline-variant/10 pt-2 text-[11px] text-muted-foreground">{stop.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Driver Logs) */}
          <div className="flex flex-col rounded-[28px] border border-outline-variant/30 bg-surface/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-4 border-b border-outline-variant/25 pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Driver Logs</p>
                  <h2 className="mt-1 text-lg font-bold text-on-surface">Daily log sheets</h2>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  id="download-pdf"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Save PDF
                </button>
              </div>

              <div className="flex overflow-x-auto gap-2 pb-1 fancy-scrollbar">
                {trip.daily_logs.map((log, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    id={`tab-day-${i + 1}`}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap transition-colors ${
                      activeTab === i
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,163,0.3)]'
                        : 'border border-outline-variant/30 bg-surface-container-low text-muted-foreground hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    Day {i + 1}
                    {log.recap.available_tomorrow < 5 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 max-h-[640px] overflow-y-auto pr-1 fancy-scrollbar">
              {trip.daily_logs[activeTab] && (
                <LogSheet
                  trip={trip}
                  dayLog={trip.daily_logs[activeTab]}
                  dayNumber={trip.daily_logs[activeTab].day_number}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function formatInstructionMeta(instruction: RouteInstruction) {
  const road = instruction.road_name ? ` via ${instruction.road_name}` : ''
  const distance = `${instruction.distance_miles.toFixed(1)} mi`
  const durationMinutes = Math.max(1, Math.round(instruction.duration_hours * 60))
  return `${distance} · ${durationMinutes} min${road}`
}

function formatStopType(stopType: string) {
  return stopType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase())
}

function formatArrivalHour(arrivalHour: number) {
  const totalMinutes = Math.round(arrivalHour * 60)
  const hour24 = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24
  const minute = totalMinutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`
}
