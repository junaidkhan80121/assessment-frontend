import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Download, Fuel, Loader2, Map, Route as RouteIcon, RotateCw, ScrollText } from 'lucide-react'
 
import { useCreateTripMutation, useGetTripQuery } from '@/api/tripsApi'
import { StatsBar } from './StatsBar'
import { TripMap } from './TripMap'
import { LogSheet, renderLogSheetCanvas } from './LogSheet'
import { TripLoadingScreen } from '@/components/TripLoadingScreen'
import { jsPDF } from 'jspdf'
import type { ApiErrorResponse, RouteInstruction, Trip } from '@/types/trip'

const PDF_RENDER_SCALE = 2
const PDF_IMAGE_QUALITY = 0.82
type TripSection = 'map' | 'details' | 'logs'

export const TripResults = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSection, setActiveSection] = useState<TripSection>('map')
  const [activeTab, setActiveTab] = useState(0)
  const [pollingInterval, setPollingInterval] = useState(5000)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null)
  const [createTrip, { isLoading: isRecalculating }] = useCreateTripMutation()
  const prefetchedTrip =
    location.state &&
    typeof location.state === 'object' &&
    'trip' in location.state &&
    (location.state as { trip?: Trip }).trip?.id === tripId
      ? (location.state as { trip?: Trip }).trip
      : undefined

  const { data: trip, isLoading, isError, error } = useGetTripQuery(tripId || '', {
    skip: !tripId,
    pollingInterval,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })
  const tripData = trip ?? prefetchedTrip

  useEffect(() => {
    if (tripData?.status === 'COMPUTING' || tripData?.status === 'PENDING') {
      setPollingInterval(5000)
      return
    }

    if (tripData?.status === 'COMPUTED' || tripData?.status === 'FAILED') {
      setPollingInterval(0)
    }
  }, [tripData?.status])

  if (!tripData && isLoading) {
    return <TripLoadingScreen />
  }

  if (!tripData || tripData.status === 'COMPUTING' || tripData.status === 'PENDING') {
    return <TripLoadingScreen />
  }

  if (isError || tripData.status === 'FAILED') {
    const apiError = (error as { data?: ApiErrorResponse } | undefined)?.data
    const errorMessage =
      tripData.error_message ||
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

  const routeInstructions = tripData.route_instructions ?? []
  const activeLog = tripData.daily_logs[activeTab]
  const workspaceHeightClass = 'xl:flex-1 xl:min-h-0'
  const panelHeightClass = 'xl:h-full xl:min-h-0'
  const sectionLinks: { id: TripSection; label: string; icon: typeof Map; description: string }[] = [
    { id: 'map', label: 'Map', icon: Map, description: 'Route geometry and snapshot' },
    { id: 'details', label: 'Details', icon: RouteIcon, description: 'Guidance, stops, and rest plan' },
    { id: 'logs', label: 'Logs', icon: ScrollText, description: 'Driver log sheets and export' },
  ]

  const handleDownloadPDF = async () => {
    if (!tripData.daily_logs.length) {
      return
    }

    setIsDownloadingPdf(true)
    setDownloadProgress(`Preparing 1/${tripData.daily_logs.length}`)

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
      compress: true,
      putOnlyUsedFonts: true,
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 24
    const imgWidth = pageWidth - margin * 2

    try {
      for (const [index, log] of tripData.daily_logs.entries()) {
        setDownloadProgress(`Rendering ${index + 1}/${tripData.daily_logs.length}`)
        await yieldToBrowser()

        const offscreenCanvas = document.createElement('canvas')
        await renderLogSheetCanvas(offscreenCanvas, tripData, log, log.day_number, { scale: PDF_RENDER_SCALE })

        setDownloadProgress(`Encoding ${index + 1}/${tripData.daily_logs.length}`)
        await yieldToBrowser()

        const imgData = offscreenCanvas.toDataURL('image/jpeg', PDF_IMAGE_QUALITY)
        const imgHeight = (offscreenCanvas.height / offscreenCanvas.width) * imgWidth

        if (index > 0) {
          pdf.addPage()
        }

        setDownloadProgress(`Adding ${index + 1}/${tripData.daily_logs.length}`)
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          margin,
          imgWidth,
          Math.min(imgHeight, pageHeight - margin * 2),
          undefined,
          'FAST',
        )

        await yieldToBrowser()
      }

      setDownloadProgress('Saving PDF')
      await yieldToBrowser()
      pdf.save(`eld-trip-${tripId}-logs.pdf`)
    } finally {
      setIsDownloadingPdf(false)
      setDownloadProgress(null)
    }
  }

  const handleRecalculateRoute = async () => {
    if (!tripData) {
      return
    }

    const nextTrip = await createTrip({
      current_location: tripData.current_location,
      current_location_lat: tripData.current_location_lat,
      current_location_lon: tripData.current_location_lon,
      pickup_location: tripData.pickup_location,
      pickup_location_lat: tripData.pickup_location_lat,
      pickup_location_lon: tripData.pickup_location_lon,
      dropoff_location: tripData.dropoff_location,
      dropoff_location_lat: tripData.dropoff_location_lat,
      dropoff_location_lon: tripData.dropoff_location_lon,
      current_cycle_used: tripData.current_cycle_used,
    }).unwrap()

    navigate(`/trip/${nextTrip.id}`, { state: { trip: nextTrip } })
  }
  return (
    <div className="relative z-10 min-h-screen px-3 pb-10 pt-24 sm:px-5 sm:pt-26 lg:px-6 xl:h-[100dvh] xl:overflow-hidden xl:px-8 xl:pb-8">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-4 xl:h-full xl:min-h-0">
        
        {/* --- HEADER --- */}
        <section className="shrink-0 rounded-[24px] border border-slate-300/80 bg-surface/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:px-4 sm:py-3 dark:border-outline-variant/30">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/')}
                className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300/80 bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container dark:border-outline-variant/30"
                id="back-button"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Trip Results</p>
                <p className="mt-0.5 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                  {tripData.current_location} → {tripData.pickup_location} → {tripData.dropoff_location}
                </p>
              </div>
            </div>

            <button
              onClick={handleRecalculateRoute}
              disabled={isRecalculating}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full border border-primary-ui-border-muted bg-primary/10 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition-all hover:scale-[1.02] hover:border-primary-ui-border hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              Recalculate Route
            </button>
          </div>

          <div className="mt-2.5">
            <StatsBar trip={tripData} />
          </div>
        </section>

        {/* xl:flex + xl:flex-col so nested xl:flex-1 (main column grid) actually receives a height budget */}
        <section
          className={`rounded-[28px] border border-slate-300/80 bg-surface/88 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-4 xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden xl:p-5 dark:border-outline-variant/30 ${workspaceHeightClass}`}
        >
          <div className={`grid min-h-0 gap-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:min-h-0 xl:flex-1 ${workspaceHeightClass}`}>
            <aside className={`min-h-0 ${workspaceHeightClass}`}>
              <div className={`rounded-[24px] border border-slate-300/70 bg-surface-container-low/40 p-4 xl:flex xl:h-full xl:flex-col xl:overflow-visible dark:border-outline-variant/20`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Trip Workspace</p>
                <h2 className="mt-1 text-lg font-bold text-on-surface">Focused route review</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Move through the trip with a single sidebar instead of hopping between tabs.
                </p>

                {/* No inner scroll on xl — keep full nav + summary visible in the sidebar */}
                <div className="mt-4 shrink-0 space-y-3">
                  {sectionLinks.map(({ id, label, icon: Icon, description }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveSection(id)}
                      className={`group flex w-full items-center justify-between rounded-[22px] border px-4 py-3.5 text-left transition-all duration-200 ${
                        activeSection === id
                          ? 'border-primary-ui-border-strong bg-[linear-gradient(135deg,rgba(0,255,163,0.16),rgba(255,255,255,0.05))] shadow-[0_10px_24px_rgba(0,255,163,0.12)]'
                          : 'border-slate-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.82))] hover:-translate-y-0.5 hover:border-primary-ui-border-muted hover:bg-surface-container dark:border-outline-variant/25 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] dark:hover:border-primary-ui-border-muted'
                      }`}
                    >
                      <span className="flex items-center gap-3.5">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                          activeSection === id ? 'bg-primary text-primary-foreground' : 'bg-primary/12 text-primary group-hover:bg-primary/18'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Section</span>
                          <span className="block text-sm font-semibold text-on-surface">{label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                        </span>
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                        activeSection === id ? 'text-primary' : 'text-muted-foreground group-hover:text-on-surface'
                      }`}>
                        {activeSection === id ? 'Open' : 'View'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 shrink-0 rounded-[20px] border border-slate-300/70 bg-surface px-3 py-3 dark:border-outline-variant/20">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trip Summary</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-semibold text-on-surface">{tripData.total_distance_miles.toFixed(1)} mi</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Drive Time</span>
                      <span className="font-semibold text-on-surface">{tripData.total_drive_hours.toFixed(1)} hrs</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Stops</span>
                      <span className="font-semibold text-on-surface">{tripData.stops.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Log Days</span>
                      <span className="font-semibold text-on-surface">{tripData.daily_logs.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className={`flex min-h-0 flex-col gap-5 xl:min-h-0 xl:overflow-hidden ${workspaceHeightClass}`}>
            {activeSection === 'map' && (
            <div className={`grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,0.55fr)] xl:overflow-hidden ${panelHeightClass}`}>
              <section className="flex min-h-0 flex-col rounded-[24px] border border-outline-variant/25 bg-card/40 p-3 sm:p-4 xl:overflow-hidden">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Map className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Route Map</p>
                    <h3 className="text-base font-bold text-on-surface">Live route overview</h3>
                  </div>
                </div>
                <div className="h-[48vh] min-h-[360px] max-h-[64vh] w-full overflow-hidden rounded-[24px] border border-outline-variant/25 bg-card sm:h-[52vh] sm:min-h-[400px] lg:h-[56vh] xl:h-full xl:min-h-0 xl:max-h-none">
                  <TripMap trip={tripData} />
                </div>
              </section>

              <div className="flex min-h-0 flex-col gap-3 xl:overflow-y-auto xl:pr-1 fancy-scrollbar">
                <div className="rounded-[20px] border border-outline-variant/20 bg-surface-container-low/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Route Snapshot</p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 text-sm">
                    <div className="rounded-[18px] border border-outline-variant/15 bg-surface px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Distance</p>
                      <p className="mt-1 text-[13px] font-semibold text-on-surface">{tripData.total_distance_miles.toFixed(1)} mi</p>
                    </div>
                    <div className="rounded-[18px] border border-outline-variant/15 bg-surface px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Drive Time</p>
                      <p className="mt-1 text-[13px] font-semibold text-on-surface">{tripData.total_drive_hours.toFixed(1)} hrs</p>
                    </div>
                    <div className="rounded-[18px] border border-outline-variant/15 bg-surface px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Stops</p>
                      <p className="mt-1 text-[13px] font-semibold text-on-surface">{tripData.stops.length}</p>
                    </div>
                    <div className="rounded-[18px] border border-outline-variant/15 bg-surface px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Log Days</p>
                      <p className="mt-1 text-[13px] font-semibold text-on-surface">{tripData.daily_logs.length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-outline-variant/20 bg-surface-container-low/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Upcoming Stops</p>
                  <div className="mt-2.5 space-y-2.5">
                    {tripData.stops.slice(0, 4).map((stop, index) => (
                      <div key={`${stop.type}-${stop.arrival_hour}-${index}`} className="rounded-[18px] border border-outline-variant/15 bg-surface px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-on-surface">{formatStopType(stop.type)}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{stop.location}</p>
                          </div>
                          <span className="rounded-lg bg-surface-container-low px-2 py-1 text-[10px] text-muted-foreground">
                            {formatArrivalHour(stop.arrival_hour)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeSection === 'details' && (
            <section
              className={`rounded-[24px] border border-outline-variant/25 bg-card/40 p-4 sm:p-5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden ${panelHeightClass}`}
            >
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Trip Details</p>
                  <h3 className="mt-1 text-lg font-bold text-on-surface">Guidance and stop plan</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Navigation guidance and rest/fuel planning live together here so you can review the trip in one pass.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  <span className="rounded-full border border-primary-ui-border-muted bg-primary/10 px-3 py-1.5 text-primary">
                    {routeInstructions.length} steps
                  </span>
                  <span className="rounded-full border border-outline-variant/25 bg-surface px-3 py-1.5 text-muted-foreground">
                    {tripData.stops.length} stops
                  </span>
                </div>
              </div>

              {/* minmax(0,1fr) row lets columns shrink so overflow-y-auto children can scroll */}
              <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:grid-rows-[minmax(0,1fr)]">
                <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-outline-variant/20 bg-surface/70 p-4 md:min-h-[320px] xl:min-h-0">
                  <div className="mb-4 flex shrink-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <RouteIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Route Instructions</p>
                      <h4 className="text-base font-bold text-on-surface">Turn-by-turn guidance</h4>
                    </div>
                  </div>
                  <div className="fancy-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-2 pb-6 [scrollbar-gutter:stable] max-h-[70vh] md:max-h-[min(70vh,560px)] xl:max-h-none">
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
                            <p className="text-sm font-semibold leading-snug text-on-surface">{instruction.text}</p>
                            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
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

                <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-outline-variant/20 bg-surface/70 p-4 md:min-h-[320px] xl:min-h-0">
                  <div className="mb-4 flex shrink-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Fuel className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Stops & Rest</p>
                      <h4 className="text-base font-bold text-on-surface">Trip stop summary</h4>
                    </div>
                  </div>
                  <div className="fancy-scrollbar grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-3 overflow-y-auto overscroll-contain pr-1 pb-6 [scrollbar-gutter:stable] max-h-[70vh] md:max-h-[min(70vh,560px)] md:grid-cols-2 xl:max-h-none xl:grid-cols-1 xl:content-start">
                    {tripData.stops.map((stop, index) => (
                      <div
                        key={`${stop.type}-${stop.arrival_hour}-${index}`}
                        className="rounded-[20px] border border-outline-variant/20 bg-surface px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-bold tracking-wide text-on-surface">{formatStopType(stop.type)}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{stop.location}</p>
                          </div>
                          <div className="shrink-0 rounded-lg bg-surface-container-low px-2 py-1 text-right text-[11px] font-medium text-muted-foreground">
                            <p className="text-on-surface">{formatArrivalHour(stop.arrival_hour)}</p>
                            <p>{stop.duration_minutes} min</p>
                          </div>
                        </div>
                        <p className="mt-3 border-t border-outline-variant/10 pt-2 text-[11px] text-muted-foreground">{stop.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </section>
            )}

            {activeSection === 'logs' && (
            <section
              className={`rounded-[24px] border border-outline-variant/25 bg-card/40 p-2 sm:p-2.5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden ${panelHeightClass}`}
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-outline-variant/20 bg-surface/65 p-2.5 shadow-[0_12px_34px_rgba(15,23,42,0.08)] sm:p-3 xl:min-h-0">
                <div className="flex shrink-0 flex-col gap-2 border-b border-outline-variant/20 pb-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                        <ScrollText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Driver Logs</p>
                        <h2 className="mt-0.5 text-[15px] font-bold text-on-surface">Daily log sheets</h2>
                        {activeLog && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatLogHeading(tripData.created_at, activeLog.day_number)} · {formatLogTimeRange(activeLog)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPdf}
                      id="download-pdf"
                      className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isDownloadingPdf ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {downloadProgress ?? 'Downloading...'}
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Save PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-hidden lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)]">
                  <div className="flex max-h-[min(70vh,520px)] min-h-0 flex-col overflow-hidden rounded-[20px] border border-outline-variant/20 bg-surface-container-low/55 p-2 lg:max-h-none lg:min-h-[200px] xl:min-h-0">
                    <p className="shrink-0 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Log Days
                    </p>
                    <div className="fancy-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-4 pr-1 [scrollbar-gutter:stable]">
                      {tripData.daily_logs.map((log, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTab(i)}
                          id={`tab-day-${i + 1}`}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-colors ${
                            activeTab === i
                              ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,163,0.2)]'
                              : 'border border-outline-variant/25 bg-surface text-muted-foreground hover:bg-surface-container hover:text-on-surface'
                          }`}
                        >
                          <span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em]">Day {i + 1}</span>
                            <span className="mt-1 block text-xs normal-case tracking-normal opacity-85">
                              {formatShortLogDate(tripData.created_at, log.day_number)}
                            </span>
                          </span>
                          {log.recap.available_tomorrow < 5 && (
                            <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex min-h-[280px] flex-col overflow-hidden lg:min-h-0">
                    <div className="shrink-0 rounded-[18px] border border-outline-variant/20 bg-surface-container-low/55 px-3 py-1.5">
                      {activeLog && (
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date</p>
                            <p className="mt-0.5 font-semibold text-on-surface">{formatLogHeading(tripData.created_at, activeLog.day_number)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Drive</p>
                            <p className="mt-0.5 font-semibold text-on-surface">{activeLog.totals.DRIVING.toFixed(1)} hrs</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">On Duty</p>
                            <p className="mt-0.5 font-semibold text-on-surface">{activeLog.recap.on_duty_today.toFixed(1)} hrs</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* flex-col + shrink-0 so the log sheet keeps its natural height and this panel scrolls (stretch was clipping the canvas) */}
                    <div className="fancy-scrollbar mt-2 flex min-h-0 flex-1 flex-col items-stretch overflow-y-auto overscroll-contain rounded-[22px] border border-outline-variant/20 bg-surface-container-low/30 p-2 [scrollbar-gutter:stable] sm:p-3">
                      <div className="mx-auto w-full max-w-full shrink-0 pb-8 sm:max-w-[min(100%,1026px)]">
                        {activeLog && (
                          <LogSheet trip={tripData} dayLog={activeLog} dayNumber={activeLog.day_number} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
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

function formatShortLogDate(createdAt: string, dayNumber: number) {
  const date = resolveLogDate(createdAt, dayNumber)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatLogHeading(createdAt: string, dayNumber: number) {
  const date = resolveLogDate(createdAt, dayNumber)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatLogTimeRange(log: { duty_entries: { start: string; end: string }[] }) {
  if (!log.duty_entries.length) {
    return '24-hour log'
  }
  const first = log.duty_entries[0]
  const last = log.duty_entries[log.duty_entries.length - 1]
  return `${first.start} - ${last.end}`
}

function resolveLogDate(createdAt: string, dayNumber: number) {
  const date = new Date(createdAt || Date.now())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + (dayNumber - 1))
  return date
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })
}
