import { Fragment, useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion, useSpring } from 'framer-motion'
import { MapContainer, TileLayer, Polyline, ZoomControl, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from 'next-themes'
import { Expand, Minimize, Truck } from 'lucide-react'
import type { Trip, TripStop } from '@/types/trip'
import 'leaflet/dist/leaflet.css'

interface TripMapProps {
  trip: Trip
}

type RouteMapStyle = 'default' | 'voyager' | 'minimal' | 'terrain' | 'dark' | 'satellite'

const MARKER_COLORS: Record<string, string> = {
  CURRENT: '#64B5F6',
  PICKUP: '#81C784',
  DROPOFF: '#E57373',
  FUEL: '#FFB74D',
  REST: '#9575CD',
  BREAK: '#FFF176',
}

const MARKER_LABELS: Record<string, string> = {
  CURRENT: 'S',
  PICKUP: 'P',
  DROPOFF: 'D',
  FUEL: 'F',
  REST: 'R',
  BREAK: 'B',
}

const MAP_STYLE_LABELS: Record<RouteMapStyle, string> = {
  default: 'Default',
  voyager: 'Voyager',
  minimal: 'Minimal',
  terrain: 'Terrain',
  dark: 'Dark',
  satellite: 'Satellite',
}

const createMarkerIcon = (color: string, label: string) => L.divIcon({
  className: '',
  html: `
    <div style="position:relative; width:28px; height:28px;">
      <div style="
        position:absolute; inset:0; border-radius:50%;
        background:${color}; opacity:0.25;
        animation: markerPulse 2s ease-in-out infinite;
      "></div>
      <div style="
        position:absolute; inset:4px; border-radius:50%;
        background:${color}; border:2px solid white;
        display:flex; align-items:center; justify-content:center;
        font-size:10px; font-weight:700; color:white;
      ">${label}</div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const createVehicleIcon = (accentColor: string) => L.divIcon({
  className: '',
  html: `
    <div style="position:relative; width:34px; height:34px;">
      <div style="
        position:absolute; inset:0; border-radius:999px;
        background:${accentColor}; opacity:0.18;
        box-shadow:0 0 18px ${accentColor};
      "></div>
      <div style="
        position:absolute; inset:4px; border-radius:999px;
        background:#0f172a; border:2px solid white;
        display:flex; align-items:center; justify-content:center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 8h11l3 3h4v6h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3V8Z" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 8v3h6" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="7" cy="17" r="1.6" fill="white"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [24, 26], // Adjusted so truck is just slightly offset from the start marker
})

function StopMarkers({ stops }: { stops: TripStop[] }) {
  const map = useMap()

  useEffect(() => {
    const markers: L.Marker[] = []
    stops.forEach((stop) => {
      if (stop.lat === 0 && stop.lon === 0) return
      const color = MARKER_COLORS[stop.type] || '#6B7280'
      const label = MARKER_LABELS[stop.type] || '•'
      const marker = L.marker([stop.lat, stop.lon], {
        icon: createMarkerIcon(color, label),
      })
      marker.bindPopup(`
        <div style="font-family: 'IBM Plex Sans', sans-serif; padding: 4px;">
          <strong>${stop.type}</strong><br/>
          <span style="font-size:12px;">${stop.location}</span><br/>
          <span style="font-size:11px; color:#666;">${stop.description}</span>
        </div>
      `)
      marker.addTo(map)
      markers.push(marker)
    })

    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [stops, map])

  return null
}

function StaticRouteVehicle({
  position,
  accentColor,
}: {
  position: [number, number]
  accentColor: string
}) {
  const map = useMap()

  useEffect(() => {
    const marker = L.marker(position, {
      icon: createVehicleIcon(accentColor),
      zIndexOffset: 1200,
    }).addTo(map)

    return () => {
      marker.remove()
    }
  }, [accentColor, map, position])

  return null
}

function FitBounds({ trip }: { trip: Trip }) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = []
    trip.stops.forEach((stop) => {
      if (stop.lat !== 0 || stop.lon !== 0) {
        points.push([stop.lat, stop.lon])
      }
    })
    if (trip.route_geometry.length > 0) {
      trip.route_geometry.forEach((point) => points.push(point))
    }
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((point) => L.latLng(point[0], point[1])))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [trip, map])

  return null
}

function MapViewportSync({ syncKey }: { syncKey: string }) {
  const map = useMap()

  useEffect(() => {
    let frame = window.requestAnimationFrame(() => {
      map.invalidateSize(false)
    })
    const timeout = window.setTimeout(() => {
      map.invalidateSize(true)
    }, 180)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [map, syncKey])

  return null
}

function splitRouteAtPickup(
  positions: [number, number][],
  pickup: [number, number],
): { beforePickup: [number, number][], afterPickup: [number, number][] } {
  if (positions.length < 2) {
    return { beforePickup: positions, afterPickup: [] }
  }

  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  positions.forEach(([lat, lon], index) => {
    const distance = Math.hypot(lat - pickup[0], lon - pickup[1])
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  const safeSplitIndex = Math.min(Math.max(closestIndex, 1), positions.length - 1)

  return {
    beforePickup: positions.slice(0, safeSplitIndex + 1),
    afterPickup: positions.slice(safeSplitIndex),
  }
}

export const TripMap = ({ trip }: TripMapProps) => {
  const { theme } = useTheme()
  const [mapStyle, setMapStyle] = useState<RouteMapStyle>(theme === 'light' ? 'voyager' : 'dark')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasManuallyChangedStyle, setHasManuallyChangedStyle] = useState(false)
  const hoverX = useSpring(0, { stiffness: 320, damping: 24, mass: 0.6 })
  const hoverY = useSpring(0, { stiffness: 320, damping: 24, mass: 0.6 })
  const hoverScale = useSpring(1, { stiffness: 280, damping: 22, mass: 0.7 })

  const tileUrl = useMemo(() => {
    if (mapStyle === 'voyager') {
      return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    }

    if (mapStyle === 'minimal') {
      return 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
    }

    if (mapStyle === 'terrain') {
      return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    }

    if (mapStyle === 'dark') {
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    }

    if (mapStyle === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }

    return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  }, [mapStyle])

  const attribution = useMemo(() => {
    if (mapStyle === 'terrain') {
      return 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
    }

    if (mapStyle === 'satellite') {
      return 'Tiles &copy; Esri'
    }

    return '&copy; <a href="https://carto.com/">CARTO</a>'
  }, [mapStyle])

  const center = useMemo((): [number, number] => {
    const validStops = trip.stops.filter((stop) => stop.lat !== 0 || stop.lon !== 0)
    if (validStops.length > 0) {
      const avgLat = validStops.reduce((acc, stop) => acc + stop.lat, 0) / validStops.length
      const avgLon = validStops.reduce((acc, stop) => acc + stop.lon, 0) / validStops.length
      return [avgLat, avgLon]
    }
    return [39.8283, -98.5795]
  }, [trip.stops])

  const routeOptions = useMemo(() => trip.route_options ?? [], [trip.route_options])
  const hasRouteOptions = routeOptions.length > 0
  const hasAlternatives = routeOptions.length > 1
  const routeAvailabilityCopy = hasAlternatives
    ? `${routeOptions.length} viable routes shown`
    : 'No alternate routes available'
  const routePolicyCopy = hasAlternatives
    ? 'Only distinct, viable alternatives are shown. Longer or near-duplicate paths may be filtered out.'
    : 'The planner only shows distinct, viable alternatives. Longer or low-value paths may be discarded.'
  const startPosition = useMemo<[number, number]>(
    () => [trip.current_location_lat, trip.current_location_lon],
    [trip.current_location_lat, trip.current_location_lon],
  )
  const pickupPosition = useMemo<[number, number]>(
    () => [trip.pickup_location_lat, trip.pickup_location_lon],
    [trip.pickup_location_lat, trip.pickup_location_lon],
  )
  const dropoffPosition = useMemo<[number, number]>(
    () => [trip.dropoff_location_lat, trip.dropoff_location_lon],
    [trip.dropoff_location_lat, trip.dropoff_location_lon],
  )
  const fallbackRouteSplit = useMemo(
    () => splitRouteAtPickup(trip.route_geometry as [number, number][], pickupPosition),
    [pickupPosition, trip.route_geometry],
  )
  const primaryRoutePositions = useMemo<[number, number][]>(() => {
    if (hasRouteOptions) {
      return (routeOptions.find((option) => option.is_fastest)?.route_geometry ?? routeOptions[0]?.route_geometry ?? []) as [number, number][]
    }

    return trip.route_geometry as [number, number][]
  }, [hasRouteOptions, routeOptions, trip.route_geometry])
  const vehicleAccent = theme === 'dark' ? '#22D3EE' : '#2563EB'

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12

    hoverX.set(x)
    hoverY.set(y)
    hoverScale.set(1.01)
  }

  const handleMouseLeave = () => {
    hoverX.set(0)
    hoverY.set(0)
    hoverScale.set(1)
  }

  const isLightBasemap = mapStyle === 'default' || mapStyle === 'voyager' || mapStyle === 'minimal' || mapStyle === 'terrain'
  const overlaySurfaceClass = isLightBasemap
    ? 'bg-white/92 text-slate-950 border-slate-300/90'
    : 'bg-slate-950/78 text-slate-100 border-white/12'
  const routeControlsClass = isLightBasemap
    ? 'bg-white/86 text-slate-900 border-slate-200/80'
    : 'bg-slate-950/78 text-slate-100 border-white/12'
  const overlayHeadingClass = isLightBasemap ? 'text-slate-900' : 'text-white'
  const overlayMutedClass = isLightBasemap ? 'text-slate-600' : 'text-slate-300'
  const overlayCardClass = isLightBasemap
    ? 'border-white/70 bg-white/72 backdrop-blur-xl'
    : 'border-white/8 bg-white/[0.05]'

  useEffect(() => {
    if (hasManuallyChangedStyle) {
      return
    }

    setMapStyle(theme === 'light' ? 'voyager' : 'dark')
  }, [hasManuallyChangedStyle, theme])

  useEffect(() => {
    if (!isFullscreen) {
      return
    }

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
    }
  }, [isFullscreen])

  const mapShell = (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[1600] h-screen w-screen bg-background/95 p-3 sm:p-4' : 'relative h-full min-h-[26rem] w-full sm:min-h-[30rem] lg:min-h-0'}`}>
      <div
        className={`relative h-full w-full overflow-hidden border border-border shadow-2xl ${
          isLightBasemap ? 'bg-[#dbe5ef]' : 'bg-slate-950'
        } ${isFullscreen ? 'rounded-[28px]' : ''}`}
        id="trip-map"
      >
      <div className={`absolute z-[500] w-[250px] rounded-xl border px-2.5 py-2 backdrop-blur-xl shadow-xl ${
        isFullscreen ? 'left-3 top-16 sm:left-4 sm:top-20' : 'left-3 top-3'
      } ${overlaySurfaceClass}`}>
        {hasRouteOptions && routeOptions.some((option) => option.is_fastest) && (
          <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${isLightBasemap ? 'border-primary-ui-border bg-primary/10 text-emerald-800' : 'border-primary-ui-border-muted bg-primary/12 text-primary'}`}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(0,255,163,0.55)]" />
            Fastest route highlighted
          </div>
        )}
        <div className={`mb-2.5 rounded-xl border px-2.5 py-2 ${overlayCardClass}`}>
          <p className={`text-[8.5px] font-bold uppercase tracking-[0.16em] ${overlayHeadingClass}`}>{routeAvailabilityCopy}</p>
          <p className={`mt-1 text-[10px] normal-case leading-relaxed ${overlayMutedClass}`}>{routePolicyCopy}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div className={`flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${overlayHeadingClass}`}>
            <span className="inline-block h-[3px] w-6 rounded-full bg-[#0284C7]" />
            <span>To pickup</span>
          </div>
          <div className={`flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${overlayMutedClass}`}>
            <span className="inline-block h-[3px] w-6 rounded-full bg-[#059669]" />
            <span>To dropoff</span>
          </div>
          {hasAlternatives ? (
            <>
              <div className={`flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${overlayMutedClass}`}>
                <span className="inline-block w-6 border-t-[3px] border-dashed border-[#7DD3FC] opacity-90" />
                <span>Alt pickup</span>
              </div>
              <div className={`flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${overlayMutedClass}`}>
                <span className="inline-block w-6 border-t-[3px] border-dashed border-[#86EFAC] opacity-90" />
                <span>Alt dropoff</span>
              </div>
            </>
          ) : null}
        </div>
        <div className={`mt-2.5 grid grid-cols-2 gap-x-2 gap-y-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${overlayMutedClass}`}>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#3B82F6] text-[8px] font-bold text-white">S</span>
            <span>Start</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E] text-[8px] font-bold text-white">P</span>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#EF4444] text-[8px] font-bold text-white">D</span>
            <span>Dropoff</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#F97316] text-white">
               <Truck className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <span>Current Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FFB74D] text-[8px] font-bold text-white">F</span>
            <span>Fuel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#9575CD] text-[8px] font-bold text-white">R</span>
            <span>Rest</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FFF176] text-[8px] font-bold text-slate-900">B</span>
            <span>Break</span>
          </div>
        </div>
        <div className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2">
          {hasRouteOptions ? (
            routeOptions.map((option, index) => (
              <div
                key={option.id}
                className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] ${overlayCardClass}`}
              >
                <div className={`flex items-center gap-2 ${overlayHeadingClass}`}>
                  <span className={`inline-block h-[3px] w-6 rounded-full ${option.is_fastest ? 'bg-[#0284C7]' : 'border-t-[3px] border-dashed border-[#7DD3FC]'}`} />
                  <span>{option.is_fastest ? 'Fastest route' : `Alternative ${index}`}</span>
                </div>
                <span className={overlayMutedClass}>{option.total_distance_miles.toFixed(1)} mi</span>
              </div>
            ))
          ) : (
            <div className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] ${overlayCardClass}`}>
              <span className={overlayHeadingClass}>Main route</span>
              <span className={overlayMutedClass}>{trip.total_distance_miles.toFixed(1)} mi</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsFullscreen((current) => !current)}
        className={`absolute right-3 top-3 z-[560] inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl shadow-xl transition-all ${
          isLightBasemap
            ? 'border-slate-200/80 bg-white/90 text-slate-700 hover:bg-white hover:text-slate-950'
            : 'border-white/12 bg-slate-950/82 text-slate-200 hover:bg-slate-900 hover:text-white'
        }`}
        aria-label={isFullscreen ? 'Exit fullscreen map' : 'Open fullscreen map'}
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </button>

      <div className={`absolute z-[550] flex w-max max-w-[calc(100%-84px)] flex-nowrap items-center justify-start gap-1.5 overflow-x-auto rounded-2xl border px-2 py-2 backdrop-blur-xl shadow-xl ${routeControlsClass} ${
        isFullscreen ? 'left-1/2 top-3 -translate-x-1/2 sm:top-4' : 'right-16 top-3'
      }`}>
        {(Object.keys(MAP_STYLE_LABELS) as RouteMapStyle[]).map((styleKey) => (
          <button
            key={styleKey}
            type="button"
            onClick={() => {
              setHasManuallyChangedStyle(true)
              setMapStyle(styleKey)
            }}
            className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all ${
              mapStyle === styleKey
                ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(0,255,163,0.24)]'
                : isLightBasemap
                  ? 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 hover:text-slate-950'
                  : 'bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            {MAP_STYLE_LABELS[styleKey]}
          </button>
        ))}
      </div>

      <motion.div
        className="h-full w-full"
        style={{ x: hoverX, y: hoverY, scale: hoverScale }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <style>{`
          #trip-map .leaflet-control-zoom {
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.28);
          }

          #trip-map .leaflet-control-zoom a {
            width: 34px;
            height: 34px;
            line-height: 34px;
            background: rgba(15, 23, 42, 0.86);
            color: #e5e7eb;
            border-bottom-color: rgba(255, 255, 255, 0.08);
          }

          #trip-map .leaflet-control-zoom a:hover {
            background: rgba(30, 41, 59, 0.96);
            color: white;
          }

          #trip-map .leaflet-control-attribution {
            background: rgba(15, 23, 42, 0.68);
            color: rgba(226, 232, 240, 0.86);
            border-radius: 10px 0 0 0;
            padding: 2px 8px;
            backdrop-filter: blur(10px);
          }

          #trip-map .leaflet-control-attribution a {
            color: inherit;
          }

          #trip-map .leaflet-bottom.leaflet-right {
            right: 12px;
            bottom: 16px;
          }

          @media (max-width: 1024px) {
            #trip-map .leaflet-bottom.leaflet-right {
              bottom: 72px;
            }
          }

          @media (max-width: 768px) {
            #trip-map .leaflet-control-container .leaflet-top.leaflet-left,
            #trip-map .leaflet-control-container .leaflet-top.leaflet-right {
              max-width: calc(100% - 24px);
            }
          }
        `}</style>
        <MapContainer
          center={center}
          zoom={5}
          className="h-full w-full"
          zoomControl={false}
          zoomSnap={0.5}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={160}
          scrollWheelZoom
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution={attribution}
            url={tileUrl}
          />
          <MapViewportSync syncKey={`${isFullscreen}-${mapStyle}-${trip.id}-${trip.stops.length}-${routeOptions.length}`} />
          {hasRouteOptions
            ? routeOptions.map((option) => {
                const isFastest = Boolean(option.is_fastest)
                const positions = option.route_geometry ?? []
                if (positions.length === 0) {
                  return null
                }
                const { beforePickup, afterPickup } = splitRouteAtPickup(
                  positions as [number, number][],
                  pickupPosition,
                )

                return (
                  <Fragment key={option.id}>
                    {beforePickup.length > 1 && (
                      <Polyline
                        positions={beforePickup}
                        pathOptions={{
                          color: isFastest
                            ? theme === 'dark' ? '#38BDF8' : '#0284C7'
                            : theme === 'dark' ? '#7DD3FC' : '#7DD3FC',
                          weight: isFastest ? 6 : 4,
                          opacity: isFastest ? 0.95 : 0.72,
                          dashArray: isFastest ? undefined : '10 8',
                          lineJoin: 'round',
                          lineCap: 'round',
                        }}
                      />
                    )}
                    {afterPickup.length > 1 && (
                      <Polyline
                        positions={afterPickup}
                        pathOptions={{
                          color: isFastest
                            ? theme === 'dark' ? '#34D399' : '#059669'
                            : theme === 'dark' ? '#86EFAC' : '#86EFAC',
                          weight: isFastest ? 4 : 2.5,
                          opacity: isFastest ? 0.95 : 0.72,
                          dashArray: isFastest ? undefined : '10 8',
                          lineJoin: 'round',
                          lineCap: 'round',
                        }}
                      />
                    )}
                  </Fragment>
                )
              })
            : trip.route_geometry.length > 0 && (
                <>
                  {fallbackRouteSplit.beforePickup.length > 1 && (
                    <Polyline
                      positions={fallbackRouteSplit.beforePickup}
                      pathOptions={{
                        color: theme === 'dark' ? '#38BDF8' : '#0284C7',
                        weight: 6,
                        opacity: 0.92,
                        lineJoin: 'round',
                        lineCap: 'round',
                      }}
                    />
                  )}
                  {fallbackRouteSplit.afterPickup.length > 1 && (
                    <Polyline
                      positions={fallbackRouteSplit.afterPickup}
                      pathOptions={{
                        color: theme === 'dark' ? '#34D399' : '#059669',
                        weight: 4,
                        opacity: 0.92,
                        lineJoin: 'round',
                        lineCap: 'round',
                      }}
                    />
                  )}
                </>
              )}

          <StaticRouteVehicle position={startPosition} accentColor={vehicleAccent} />
          <StopMarkers stops={trip.stops} />
          <CircleMarker 
            center={startPosition}
            pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 1, weight: 2 }}
            radius={5}
          />
          <CircleMarker 
            center={pickupPosition}
            pathOptions={{ color: '#22C55E', fillColor: '#22C55E', fillOpacity: 1, weight: 2, className: 'marker-pulse' }}
            radius={6}
          />
          <CircleMarker 
            center={dropoffPosition}
            pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1, weight: 2, className: 'marker-pulse' }}
            radius={6}
          />
          <FitBounds trip={trip} />
        </MapContainer>
      </motion.div>
      </div>
    </div>
  )

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(mapShell, document.body)
  }

  return mapShell
}
