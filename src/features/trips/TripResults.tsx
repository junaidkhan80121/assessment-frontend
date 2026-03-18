import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, RotateCw } from 'lucide-react'
import { useTheme } from 'next-themes'
 
import { useCreateTripMutation, useGetTripQuery } from '@/api/tripsApi'
import { StatsBar } from './StatsBar'
import { TripMap } from './TripMap'
import { LogSheet } from './LogSheet'
import { TripLoadingScreen } from '@/components/TripLoadingScreen'
import { jsPDF } from 'jspdf'
import type { ApiErrorResponse } from '@/types/trip'

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

  const handleDownloadPDF = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
    const selectedLog = trip.daily_logs[activeTab]

    if (!selectedLog) {
      return
    }

    const canvas = document.querySelector(`#log-sheet-day-${selectedLog.day_number} canvas`) as HTMLCanvasElement
    if (!canvas) {
      return
    }

    const imgData = canvas.toDataURL('image/png')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 30
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height / canvas.width) * imgWidth

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - margin * 2))
    pdf.save(`eld-trip-${tripId}-day-${selectedLog.day_number}.pdf`)
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
    <div className="relative z-10 min-h-screen px-4 pb-4 pt-28 sm:px-6 sm:pt-28 lg:px-8 xl:h-[100svh] xl:overflow-hidden xl:pb-3">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-2.5 xl:h-full">
        <section className="rounded-[24px] border border-outline-variant/30 bg-surface/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:px-4 sm:py-2.5 xl:flex-shrink-0">
          <div className="flex flex-col gap-1.5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <button
                onClick={() => navigate('/')}
                className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container"
                id="back-button"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Trip Results</p>
                <p className="mt-0.5 max-w-4xl text-xs text-muted-foreground sm:text-[13px]">
                  {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}
                </p>
              </div>
            </div>

            <button
              onClick={handleRecalculateRoute}
              disabled={isRecalculating}
              className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary transition-all hover:scale-[1.02] hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw className={`h-3 w-3 ${isRecalculating ? 'animate-spin' : ''}`} />
              Recalculate Route
            </button>
          </div>

          <div className="mt-1.5">
            <StatsBar trip={trip} />
          </div>
        </section>

        <section className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.95fr)] xl:items-stretch">
          <div className="flex flex-col rounded-[28px] border border-outline-variant/30 bg-surface/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-4 xl:min-h-0">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Route Map</p>
                <h2 className="mt-1 text-lg font-bold text-on-surface">Primary route and alternatives</h2>
              </div>
              <p className="text-xs text-muted-foreground">Fullscreen, alternate tiles, moving vehicle</p>
            </div>
            <div className="h-[540px] flex-1 overflow-hidden rounded-[24px] border border-outline-variant/25 bg-card lg:h-[640px] xl:min-h-0">
              <TripMap trip={trip} />
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-[28px] border border-outline-variant/30 bg-surface/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-4 xl:min-h-0">
            <div className="flex flex-col gap-3 border-b border-outline-variant/25 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Driver Logs</p>
                  <h2 className="mt-1 text-lg font-bold text-on-surface">Daily log sheets and trip events</h2>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  id="download-pdf"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>

              <div className="flex overflow-x-auto gap-2 pb-1">
                {trip.daily_logs.map((log, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    id={`tab-day-${i + 1}`}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] whitespace-nowrap transition-colors ${
                      activeTab === i
                        ? 'bg-primary text-primary-foreground shadow-[0_0_18px_rgba(0,255,163,0.18)]'
                        : 'border border-outline-variant/30 bg-surface-container-low text-muted-foreground hover:bg-surface-container'
                    }`}
                  >
                    Day {i + 1}
                    {log.recap.available_tomorrow < 5 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto pt-4">
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
