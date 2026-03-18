import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { motion, useSpring } from 'framer-motion'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from 'next-themes'
import { Expand, Minimize } from 'lucide-react'
import type { Trip, TripStop } from '@/types/trip'
import 'leaflet/dist/leaflet.css'

interface TripMapProps {
  trip: Trip
}

type RouteMapStyle = 'default' | 'terrain' | 'dark' | 'satellite'

const MARKER_COLORS: Record<string, string> = {
  CURRENT: '#3B82F6',
  PICKUP: '#22C55E',
  DROPOFF: '#EF4444',
  FUEL: '#F97316',
  REST: '#8B5CF6',
  BREAK: '#EAB308',
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

export const TripMap = ({ trip }: TripMapProps) => {
  const { theme } = useTheme()
  const [mapStyle, setMapStyle] = useState<RouteMapStyle>('default')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hoverX = useSpring(0, { stiffness: 320, damping: 24, mass: 0.6 })
  const hoverY = useSpring(0, { stiffness: 320, damping: 24, mass: 0.6 })
  const hoverScale = useSpring(1, { stiffness: 280, damping: 22, mass: 0.7 })

  useEffect(() => {
    setMapStyle((current) => {
      if (theme === 'dark') {
        return current === 'default' ? 'dark' : current
      }

      return current === 'dark' ? 'default' : current
    })
  }, [theme])

  const tileUrl = useMemo(() => {
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

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[1200] h-screen w-screen bg-background p-3' : 'relative h-[360px] lg:h-full w-full'}`}>
      <div className="relative h-full w-full overflow-hidden border border-border bg-card shadow-2xl" id="trip-map">
      <div className="absolute left-3 top-3 z-[500] rounded-2xl border border-white/10 bg-background/85 px-3 py-2 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface">
          <span className="inline-block h-[3px] w-8 rounded-full bg-[#2563EB]" />
          <span>Main route</span>
        </div>
        {hasRouteOptions && (
          <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
            <span className="inline-block w-8 border-t-[3px] border-dashed border-[#64748B] opacity-80" />
            <span>Alternative route</span>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#3B82F6] text-[9px] font-bold text-white">S</span>
            <span>Start</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E] text-[9px] font-bold text-white">P</span>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-bold text-white">D</span>
            <span>Dropoff</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#F97316] text-[9px] font-bold text-white">F</span>
            <span>Fuel/Rest</span>
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-[500] flex items-center gap-2 rounded-full border border-white/10 bg-background/85 px-2 py-2 backdrop-blur-xl shadow-xl">
        <button
          type="button"
          onClick={() => setIsFullscreen((current) => !current)}
          className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </button>
        {(Object.keys(MAP_STYLE_LABELS) as RouteMapStyle[]).map((styleKey) => (
          <button
            key={styleKey}
            type="button"
            onClick={() => setMapStyle(styleKey)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all ${
              mapStyle === styleKey
                ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(0,255,163,0.24)]'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
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
        <MapContainer
          center={center}
          zoom={5}
          className="h-full w-full"
          zoomControl
          zoomSnap={0.5}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={160}
          scrollWheelZoom
        >
          <TileLayer
            attribution={attribution}
            url={tileUrl}
          />
          {hasRouteOptions
            ? routeOptions.map((option) => {
                const isFastest = Boolean(option.is_fastest)
                const positions = option.route_geometry ?? []
                if (positions.length === 0) {
                  return null
                }

                return (
                  <Polyline
                    key={option.id}
                    positions={positions}
                    pathOptions={{
                      color: isFastest
                        ? theme === 'dark' ? '#3B82F6' : '#2563EB'
                        : theme === 'dark' ? '#94A3B8' : '#64748B',
                      weight: isFastest ? 5 : 3,
                      opacity: isFastest ? 0.95 : 0.7,
                      dashArray: isFastest ? undefined : '10 8',
                      lineJoin: 'round',
                      lineCap: 'round',
                    }}
                  />
                )
              })
            : trip.route_geometry.length > 0 && (
                <>
                  <Polyline
                    positions={trip.route_geometry}
                    pathOptions={{
                      color: theme === 'dark' ? '#0F172A' : '#1E40AF',
                      weight: 8,
                      opacity: 0.6,
                      lineJoin: 'round',
                      lineCap: 'round',
                    }}
                  />
                  <Polyline
                    positions={trip.route_geometry}
                    pathOptions={{
                      color: theme === 'dark' ? '#3B82F6' : '#60A5FA',
                      weight: 4,
                      opacity: 1,
                      lineJoin: 'round',
                      lineCap: 'round',
                    }}
                  />
                </>
              )}
          <StopMarkers stops={trip.stops} />
          <FitBounds trip={trip} />
        </MapContainer>
      </motion.div>
      </div>
    </div>
  )
}
