import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ChevronRight, Download, Fuel, Loader2, Map, MapPin, Route as RouteIcon, RotateCw, ScrollText } from 'lucide-react'
 
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
      setPollingInterval(1500)
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
      <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(239,68,68,0.12),transparent)]" />
        <div className="relative max-w-md rounded-3xl border border-destructive/25 bg-surface/95 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:bg-surface-container/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/5 text-destructive">
            <AlertTriangle className="h-7 w-7 opacity-90" />
          </div>
          <h2 className="font-headline text-2xl font-bold tracking-tight text-destructive">Unable to complete trip</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-[0_8px_28px_rgba(21,128,61,0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98] dark:shadow-[0_8px_28px_rgba(0,255,163,0.2)]"
          >
            Return to planner
          </button>
        </div>
      </div>
    )
  }

  const routeInstructions = tripData.route_instructions ?? []
  const routeOptions = tripData.route_options ?? []
  const hasAlternatives = routeOptions.length > 1
  const routeAvailabilityCopy = hasAlternatives ? `${routeOptions.length} viable routes found` : 'No alternate routes available'
  const routePolicyCopy = hasAlternatives
    ? 'Only distinct, viable alternatives are shown. Longer or near-duplicate paths may be filtered out.'
    : 'The planner only shows distinct, viable alternatives. Longer or low-value paths may be discarded.'
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
    <div className="relative z-10 min-h-screen overflow-x-hidden px-3 pb-8 pt-24 sm:px-5 sm:pt-26 lg:px-6 xl:h-[100dvh] xl:overflow-hidden xl:px-8 xl:pb-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
        <div className="absolute -left-[12%] top-[14%] h-[min(520px,62vw)] w-[min(520px,62vw)] rounded-full bg-primary/[0.08] blur-[120px] dark:bg-primary/[0.14]" />
        <div className="absolute -right-[15%] top-[32%] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.07] blur-[100px] dark:bg-cyan-400/[0.12]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-2.5 xl:h-full xl:min-h-0 xl:gap-3">
        {/* Compact header — tuned for light + dark; frees vertical space for log book on xl */}
        <section className="relative shrink-0 overflow-hidden rounded-2xl border border-primary-ui-border-muted bg-gradient-to-br from-card via-surface to-surface-container-low/85 p-2.5 shadow-md ring-1 ring-black/[0.04] backdrop-blur-xl sm:p-3 dark:border-white/[0.07] dark:from-surface-container/92 dark:via-surface/82 dark:to-surface-container-low/35 dark:shadow-[0_20px_56px_rgba(0,0,0,0.45)] dark:ring-white/[0.06]">
          <div className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-primary/[0.06] blur-[64px] dark:bg-primary/[0.14]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-ui-border-strong/35 to-transparent" />
          <div className="relative flex items-start gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-ui-border-muted bg-surface-container-low/90 text-on-surface shadow-sm ring-offset-background transition-colors hover:border-primary-ui-border hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:bg-surface-container/55 dark:shadow-none"
              id="back-button"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Trip command center</p>
                <span className="rounded-md border border-primary-ui-border-muted bg-primary/8 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant dark:bg-primary/10 dark:text-muted-foreground">
                  ID {tripData.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="font-headline mt-0.5 text-lg font-bold leading-tight tracking-tight text-on-surface sm:text-xl">
                Route outcome &amp; compliance
              </h1>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-on-surface-variant dark:text-muted-foreground">Three-leg preview</p>
            </div>
            <button
              type="button"
              onClick={handleRecalculateRoute}
              disabled={isRecalculating}
              className="mt-0.5 inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-primary-ui-border bg-primary/10 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary shadow-sm transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-55 sm:px-3 dark:bg-primary/12 dark:shadow-[0_6px_20px_rgba(0,255,163,0.08)]"
            >
              <RotateCw className={`h-3 w-3 shrink-0 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span className="hidden min-[420px]:inline">Recalc</span>
            </button>
          </div>
          <div className="relative mt-2 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.78fr)] xl:items-stretch">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {[
                { label: 'Current', value: tripData.current_location },
                { label: 'Pickup', value: tripData.pickup_location },
                { label: 'Dropoff', value: tripData.dropoff_location },
              ].map((leg, i) => (
                <div
                  key={`${leg.label}-${i}`}
                  className="flex min-h-0 min-w-0 items-start gap-1.5 rounded-xl border border-primary-ui-border-muted/80 bg-surface/90 px-2 py-1 shadow-sm dark:border-white/[0.06] dark:bg-surface-container/40 dark:shadow-none"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15">
                    <MapPin className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-on-surface-variant dark:text-muted-foreground">{leg.label}</span>
                    <span className="mt-px block truncate text-[11px] font-semibold leading-snug text-on-surface" title={leg.value}>
                      {leg.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-primary-ui-border-muted/60 bg-surface-container-low/50 p-1.5 dark:border-white/[0.05] dark:bg-surface-container/15">
              <StatsBar trip={tripData} compact />
            </div>
          </div>
        </section>

        {/* xl:flex + xl:flex-col so nested xl:flex-1 (main column grid) actually receives a height budget */}
        <section
          className={`relative overflow-hidden rounded-2xl border border-primary-ui-border-muted/70 bg-gradient-to-br from-card via-surface to-surface-container-low/70 p-2.5 shadow-md ring-1 ring-black/[0.03] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:p-px before:content-[''] before:[background:linear-gradient(135deg,rgba(21,128,61,0.14),transparent_45%,transparent)] sm:p-3 xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden xl:p-4 dark:border-white/[0.06] dark:from-surface-container/88 dark:via-surface/78 dark:to-surface-container-low/35 dark:shadow-[0_28px_80px_rgba(0,0,0,0.5)] dark:ring-white/[0.04] dark:before:[background:linear-gradient(135deg,rgba(0,255,163,0.18),transparent_50%,transparent)] ${workspaceHeightClass}`}
        >
          <div className={`grid min-h-0 gap-3 xl:grid-cols-[272px_minmax(0,1fr)] xl:min-h-0 xl:flex-1 xl:gap-4 ${workspaceHeightClass}`}>
            <aside className={`relative min-h-0 xl:overflow-y-auto xl:pr-1 fancy-scrollbar ${workspaceHeightClass}`}>
              <div className="absolute left-0 top-6 hidden h-[calc(100%-3rem)] w-1 rounded-full bg-gradient-to-b from-primary/60 via-primary/20 to-transparent xl:block" aria-hidden />
              <div
                className={`relative h-full rounded-[26px] border border-primary-ui-border-muted/60 bg-gradient-to-b from-surface-container-low/50 via-surface/40 to-surface-container/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] xl:flex xl:flex-col dark:border-white/[0.06] dark:from-surface-container/40 dark:via-surface-container-low/25 dark:to-surface/20 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary">Workspace</p>
                <h2 className="mt-1.5 font-headline text-lg font-bold tracking-tight text-on-surface">Pick your lens</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Same trip data—switch between map, operational detail, and driver logs without losing context.
                </p>

                {/* No inner scroll on xl — keep full nav + summary visible in the sidebar */}
                <div className="mt-5 shrink-0 space-y-3">
                  {sectionLinks.map(({ id, label, icon: Icon, description }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={activeSection === id}
                      onClick={() => setActiveSection(id)}
                      className={`group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-[20px] border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        activeSection === id
                          ? 'border-primary-ui-border-strong bg-[linear-gradient(125deg,rgba(0,255,163,0.18),rgba(255,255,255,0.06))] shadow-[0_12px_32px_rgba(0,255,163,0.14)] dark:shadow-[0_12px_40px_rgba(0,255,163,0.12)]'
                          : 'border-primary-ui-border-muted/70 bg-surface/75 hover:-translate-y-0.5 hover:border-primary-ui-border-muted hover:bg-surface-container/90 dark:border-white/[0.06] dark:bg-surface-container/40 dark:hover:border-primary-ui-border-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                          activeSection === id ? 'opacity-30' : ''
                        }`}
                        style={{
                          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.14) 50%, transparent 60%)',
                          backgroundSize: '200% 100%',
                        }}
                      />
                      <span className="relative flex min-w-0 flex-1 items-center gap-3">
                        <span
                          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all ${
                            activeSection === id
                              ? 'bg-primary text-primary-foreground shadow-[0_6px_20px_rgba(0,255,163,0.35)]'
                              : 'bg-primary/10 text-primary group-hover:bg-primary/18 dark:bg-primary/15'
                          }`}
                        >
                          <Icon className="h-[17px] w-[17px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[7px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Section</span>
                          <span className="mt-0.5 block text-[0.98rem] font-semibold leading-none text-on-surface">{label}</span>
                          <span className="mt-1 block max-w-[11rem] text-[11px] leading-4 text-muted-foreground">{description}</span>
                        </span>
                      </span>
                      <span className="relative ml-2.5 flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] ${
                            activeSection === id
                              ? 'bg-primary/15 text-primary dark:bg-primary/25'
                              : 'border border-dashed border-primary-ui-border-muted/60 bg-surface/80 text-muted-foreground dark:border-white/10'
                          }`}
                        >
                          {activeSection === id ? 'Active' : 'Open'}
                        </span>
                        <span
                          className={`flex items-center gap-0.5 text-[10px] font-semibold leading-none ${
                            activeSection === id ? 'text-primary' : 'text-muted-foreground group-hover:text-on-surface'
                          }`}
                        >
                          {activeSection === id ? 'Pinned' : 'Focus'}
                          <ChevronRight className="h-3 w-3 opacity-70" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-5 shrink-0 rounded-[22px] border border-dashed border-primary-ui-border-muted/80 bg-surface/60 p-3.5 dark:border-white/12 dark:bg-surface-container/35">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Trip summary</p>
                  <div className="mt-3 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-outline-variant/10 pb-2">
                      <span className="text-muted-foreground">Stops</span>
                      <span className="font-mono font-semibold tabular-nums text-on-surface">{tripData.stops.length}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Next stop</span>
                      {tripData.stops.length > 0 ? (
                        <span className="text-right font-mono font-semibold tabular-nums text-on-surface">
                          <span className="block text-[12px]">{formatStopType(tripData.stops[0].type)}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">{formatArrivalHour(tripData.stops[0].arrival_hour)}</span>
                        </span>
                      ) : (
                        <span className="text-right font-mono font-semibold tabular-nums text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className={`flex min-h-0 flex-col gap-5 xl:min-h-0 xl:overflow-hidden ${workspaceHeightClass}`}>
            {activeSection === 'map' && (
            <div className={`grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,0.55fr)] xl:overflow-hidden ${panelHeightClass}`}>
              <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-primary-ui-border-muted/65 bg-gradient-to-br from-card/70 via-surface/50 to-surface-container-low/30 p-1 shadow-[0_16px_48px_rgba(15,23,42,0.08)] sm:p-1.5 dark:border-white/[0.07] dark:from-surface-container/50 dark:via-surface/30 dark:to-surface-container-low/20 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] xl:overflow-hidden">
                <div className="flex shrink-0 items-center justify-between gap-3 rounded-[22px] border border-primary-ui-border-muted/40 bg-surface/80 px-3 py-2.5 dark:border-white/[0.06] dark:bg-surface-container/40 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 text-primary shadow-inner">
                      <Map className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Route map</p>
                      <h3 className="font-headline text-base font-bold tracking-tight text-on-surface">Live road geometry</h3>
                    </div>
                  </div>
                </div>
                <div className="relative mt-1 min-h-0 flex-1 p-1 sm:p-1.5">
                  <div className="pointer-events-none absolute inset-3 rounded-[22px] ring-1 ring-primary-ui-border-muted/50 dark:ring-white/10" aria-hidden />
                  <div className="relative h-[48vh] min-h-[360px] max-h-[64vh] w-full overflow-hidden rounded-[22px] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),transparent)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.06)] sm:h-[52vh] sm:min-h-[400px] lg:h-[56vh] xl:h-full xl:min-h-0 xl:max-h-none dark:border-white/[0.06] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.25),transparent)] dark:shadow-[inset_0_2px_16px_rgba(0,0,0,0.4)]">
                    <TripMap trip={tripData} />
                  </div>
                </div>
              </section>

              <div className="flex min-h-0 flex-col gap-4 xl:overflow-y-auto xl:pr-1 fancy-scrollbar">
                <div className="rounded-[22px] border border-primary-ui-border-muted/55 bg-gradient-to-b from-surface-container-low/60 to-surface/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-white/[0.06] dark:from-surface-container/45 dark:to-surface/20 dark:shadow-none">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Operational snapshot</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Stops', String(tripData.stops.length)],
                      ['Route steps', String(routeInstructions.length)],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="rounded-2xl border border-outline-variant/15 bg-surface/90 px-3 py-2.5 shadow-sm dark:border-white/[0.04] dark:bg-surface-container/50"
                      >
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{k}</p>
                        <p className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-on-surface">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl border border-primary-ui-border-muted/45 bg-surface/90 px-3 py-3 dark:border-white/[0.05] dark:bg-surface-container/45">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">{routeAvailabilityCopy}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{routePolicyCopy}</p>
                  </div>
                </div>

                <div className="rounded-[22px] border border-primary-ui-border-muted/55 bg-surface-container-low/45 p-4 dark:border-white/[0.06] dark:bg-surface-container/35">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Next stops</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Earliest legs on this plan</p>
                  <div className="mt-3 space-y-2.5">
                    {tripData.stops.slice(0, 4).map((stop, index) => (
                      <div
                        key={`${stop.type}-${stop.arrival_hour}-${index}`}
                        className="group relative overflow-hidden rounded-2xl border border-outline-variant/18 bg-surface/95 px-3.5 py-3 transition-colors hover:border-primary-ui-border-muted dark:border-white/[0.05] dark:bg-surface-container/55"
                      >
                        <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-primary to-primary/20 opacity-80" aria-hidden />
                        <div className="flex items-start justify-between gap-3 pl-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-on-surface">{formatStopType(stop.type)}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{stop.location}</p>
                          </div>
                          <span className="shrink-0 rounded-xl border border-outline-variant/20 bg-surface-container-low px-2.5 py-1 text-center text-[10px] font-semibold tabular-nums text-muted-foreground">
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
              className={`relative overflow-hidden rounded-[26px] border border-primary-ui-border-muted/60 bg-gradient-to-br from-card/55 via-surface/45 to-surface-container-low/25 p-4 shadow-[0_18px_56px_rgba(15,23,42,0.07)] sm:p-5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden dark:border-white/[0.06] dark:from-surface-container/45 dark:via-surface/25 dark:to-surface-container-low/15 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)] ${panelHeightClass}`}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-primary/[0.06] blur-3xl dark:bg-primary/[0.12]" aria-hidden />
              <div className="relative flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Trip details</p>
                  <h3 className="font-headline mt-1 text-lg font-bold tracking-tight text-on-surface sm:text-xl">Guidance + stop choreography</h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Turn-by-turn narrative and every planned pause—review compliance pacing beside the nav story.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
                  <span className="rounded-full border border-primary-ui-border bg-primary/12 px-3.5 py-2 text-primary shadow-sm">
                    {routeInstructions.length} steps
                  </span>
                  <span className="rounded-full border border-outline-variant/30 bg-surface/90 px-3.5 py-2 text-muted-foreground dark:bg-surface-container/50">
                    {tripData.stops.length} stops
                  </span>
                </div>
              </div>

              {/* minmax(0,1fr) row lets columns shrink so overflow-y-auto children can scroll */}
              <div className="relative mt-5 grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden md:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:grid-rows-[minmax(0,1fr)]">
                <div className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-primary-ui-border-muted/50 bg-surface/85 p-4 shadow-inner dark:border-white/[0.05] dark:bg-surface-container/40 md:min-h-[320px] xl:min-h-0">
                  <div className="mb-4 flex shrink-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 text-primary">
                      <RouteIcon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Route instructions</p>
                      <h4 className="text-base font-bold text-on-surface">Turn-by-turn guidance</h4>
                    </div>
                  </div>
                  <div className="fancy-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-2 pb-6 [scrollbar-gutter:stable] max-h-[70vh] md:max-h-[min(70vh,560px)] xl:max-h-none">
                    {routeInstructions.map((instruction, index) => (
                      <div
                        key={`${instruction.text}-${index}`}
                        className="group relative overflow-hidden rounded-2xl border border-outline-variant/18 bg-surface px-4 py-3.5 transition-all hover:border-primary-ui-border-muted hover:shadow-md dark:border-white/[0.05] dark:bg-surface-container/30"
                      >
                        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/80 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                        <div className="flex items-start gap-4 pl-0.5 sm:pl-1">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/75 text-[11px] font-bold text-primary-foreground shadow-[0_4px_14px_rgba(0,255,163,0.25)]">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug text-on-surface">{instruction.text}</p>
                            <p className="mt-1.5 inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="h-1 w-1 rounded-full bg-primary/50" />
                              {formatInstructionMeta(instruction)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {routeInstructions.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-primary-ui-border-muted/70 bg-surface/80 px-4 py-8 text-center text-sm text-muted-foreground">
                        Route steps were not available for this trip record.
                      </div>
                    )}
                  </div>
                </div>

                <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-primary-ui-border-muted/50 bg-surface/85 p-4 shadow-inner dark:border-white/[0.05] dark:bg-surface-container/40 md:min-h-[320px] xl:min-h-0">
                  <div className="mb-4 flex shrink-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-primary/10 text-primary">
                      <Fuel className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Stops &amp; rest</p>
                      <h4 className="text-base font-bold text-on-surface">Operational breaks</h4>
                    </div>
                  </div>
                  <div className="fancy-scrollbar grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-3 overflow-y-auto overscroll-contain pr-1 pb-6 [scrollbar-gutter:stable] max-h-[70vh] md:max-h-[min(70vh,560px)] md:grid-cols-2 xl:max-h-none xl:grid-cols-1 xl:content-start">
                    {tripData.stops.map((stop, index) => (
                      <div
                        key={`${stop.type}-${stop.arrival_hour}-${index}`}
                        className="rounded-[20px] border border-outline-variant/15 bg-gradient-to-br from-surface to-surface-container-low/40 px-4 py-4 dark:border-white/[0.05] dark:from-surface-container/50 dark:to-surface/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold tracking-wide text-on-surface">{formatStopType(stop.type)}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{stop.location}</p>
                          </div>
                          <div className="shrink-0 rounded-xl border border-outline-variant/15 bg-surface-container-low px-2.5 py-1.5 text-right text-[11px] font-medium text-muted-foreground">
                            <p className="font-mono font-semibold text-on-surface">{formatArrivalHour(stop.arrival_hour)}</p>
                            <p className="font-mono text-[10px]">{formatStopDuration(stop)}</p>
                          </div>
                        </div>
                        <p className="mt-3 border-t border-outline-variant/10 pt-2 text-[11px] leading-relaxed text-muted-foreground">{stop.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </section>
            )}

            {activeSection === 'logs' && (
            <section
              className={`relative overflow-hidden rounded-[26px] border border-primary-ui-border-muted/60 bg-gradient-to-br from-card/50 via-surface/40 to-surface-container-low/25 p-2.5 sm:p-3 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden dark:border-white/[0.06] dark:from-surface-container/40 dark:via-surface/20 dark:to-surface-container-low/12 ${panelHeightClass}`}
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-primary-ui-border-muted/45 bg-surface/75 p-2 shadow-[0_16px_48px_rgba(15,23,42,0.09)] sm:p-3 xl:min-h-0 dark:border-white/[0.05] dark:bg-surface-container/35 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="flex shrink-0 flex-col gap-2 border-b border-outline-variant/15 pb-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 text-primary shadow-inner">
                        <ScrollText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-headline text-base font-bold tracking-tight text-on-surface uppercase pr-2 border-r border-outline-variant/30">Driver logs</h2>
                          <p className="text-sm font-semibold tracking-tight text-on-surface/90">Daily log sheets</p>
                        </div>
                        {activeLog && (
                          <p className="text-xs text-muted-foreground font-medium">
                            <span className="text-on-surface/80">{formatLogHeading(tripData.created_at, activeLog.day_number)}</span>
                            <span className="mx-1.5 text-outline-variant">·</span>
                            {formatLogTimeRange(activeLog)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPdf}
                      id="download-pdf"
                      className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-stretch rounded-xl border border-primary-ui-border-strong/55 bg-surface px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-primary-ui-border-strong hover:bg-surface-container-low active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-65 dark:border-primary-ui-border-muted dark:bg-surface-container dark:text-primary sm:self-center"
                    >
                      {isDownloadingPdf ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {downloadProgress ?? 'Downloading...'}
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3" />
                          Save PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[196px_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)]">
                  <div className="flex max-h-[min(70vh,520px)] min-h-0 flex-col overflow-hidden rounded-[22px] border border-primary-ui-border-muted/45 bg-gradient-to-b from-surface-container-low/55 to-surface/30 p-2.5 dark:border-white/[0.05] dark:from-surface-container/40 lg:max-h-none lg:min-h-[200px] xl:min-h-0">
                    <p className="shrink-0 px-1 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Log days</p>
                    <div className="fancy-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-4 pr-1 [scrollbar-gutter:stable]">
                      {tripData.daily_logs.map((log, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveTab(i)}
                          id={`tab-day-${i + 1}`}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                            activeTab === i
                              ? 'bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(0,255,163,0.25)] ring-1 ring-primary-ui-border-strong/50'
                              : 'border border-outline-variant/20 bg-surface/90 text-muted-foreground hover:border-primary-ui-border-muted hover:bg-surface-container hover:text-on-surface dark:border-white/[0.06] dark:bg-surface-container/45'
                          }`}
                        >
                          <span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em]">Day {i + 1}</span>
                            <span className={`mt-1 block text-xs normal-case tracking-normal ${activeTab === i ? 'opacity-95' : 'opacity-90'}`}>
                              {formatShortLogDate(tripData.created_at, log.day_number)}
                            </span>
                          </span>
                          {log.recap.available_tomorrow < 5 && (
                            <span
                              className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]"
                              title="Limited recap hours"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex min-h-[280px] flex-col overflow-hidden lg:min-h-0">
                    <div className="shrink-0 rounded-[16px] border border-primary-ui-border-muted/40 bg-surface-container-low/50 px-3 py-2 xl:mb-0 mb-1.5 dark:border-white/[0.05] dark:bg-surface-container/40">
                      {activeLog && (
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Date</p>
                            <p className="mt-0.5 font-semibold text-on-surface">{formatLogHeading(tripData.created_at, activeLog.day_number)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Drive</p>
                            <p className="mt-0.5 font-mono font-semibold tabular-nums text-on-surface">{activeLog.totals.DRIVING.toFixed(1)} hrs</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">On duty</p>
                            <p className="mt-0.5 font-mono font-semibold tabular-nums text-on-surface">{activeLog.recap.on_duty_today.toFixed(1)} hrs</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Make the log viewer wrapper expand to fill available space */}
                    <div className="fancy-scrollbar mt-1.5 flex min-h-0 flex-1 flex-col items-stretch overflow-hidden rounded-[22px] border border-primary-ui-border-muted/40 bg-surface-container-low/25 dark:border-white/[0.04] dark:bg-surface/20">
                      <div className="mx-auto flex w-full flex-col flex-1 pb-0 sm:max-w-[min(100%,1026px)]">
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

/** Human-readable duration; long rests show hours (e.g. 600 min → 10 hr) instead of "600 min". */
function formatStopDuration(stop: { type: string; duration_minutes: number }) {
  const m = stop.duration_minutes
  if (m <= 0) return '—'
  if (stop.type === 'REST' && m >= 60) {
    const h = m / 60
    if (Number.isInteger(h)) return `${h} hr off-duty`
    return `${h.toFixed(1)} hr off-duty`
  }
  if (m >= 120 && m % 60 === 0) return `${m / 60} hr`
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const rem = m % 60
    return rem === 0 ? `${h} hr` : `${h}h ${rem}m`
  }
  return `${m} min`
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
