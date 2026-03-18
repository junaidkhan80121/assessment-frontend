import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, RotateCw } from 'lucide-react'
 
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
    <div className="flex flex-col h-full">
      {/* Back button + stats */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            id="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold">Trip Results</h1>
            <p className="text-xs text-muted-foreground">
              {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}
            </p>
          </div>
          </div>
          <button
            onClick={handleRecalculateRoute}
            disabled={isRecalculating}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary transition-all hover:scale-[1.02] hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculate Route
          </button>
        </div>
        <StatsBar trip={trip} />
      </div>

      {/* Main content: map + logs */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map panel */}
        <div className="w-full lg:w-[55%] h-[300px] lg:h-auto">
          <TripMap trip={trip} />
        </div>

        {/* Log sheets panel */}
        <div className="w-full lg:w-[45%] flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-background">
          {/* Tabs */}
          <div className="flex-shrink-0 flex overflow-x-auto gap-1 p-2 border-b border-border bg-card">
            {trip.daily_logs.map((log, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                id={`tab-day-${i + 1}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeTab === i
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary text-muted-foreground"
                }`}
              >
                Day {i + 1}
                {log.recap.available_tomorrow < 5 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                )}
              </button>
            ))}
          </div>

          {/* Active log sheet */}
          <div className="flex-1 overflow-auto p-3 bg-background">
            {trip.daily_logs[activeTab] && (
              <LogSheet
                trip={trip}
                dayLog={trip.daily_logs[activeTab]}
                dayNumber={trip.daily_logs[activeTab].day_number}
              />
            )}
          </div>

          {/* Download button */}
          <div className="p-3 border-t border-border">
            <button
              onClick={handleDownloadPDF}
              id="download-pdf"
              className="w-full h-10 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Current Log PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
