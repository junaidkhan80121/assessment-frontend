import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from 'next-themes'
import type { Trip, TripStop } from '@/types/trip'
import 'leaflet/dist/leaflet.css'

interface TripMapProps {
  trip: Trip
}

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
      markers.forEach(m => m.remove())
    }
  }, [stops, map])

  return null
}

function FitBounds({ trip }: { trip: Trip }) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = []
    trip.stops.forEach((s) => {
      if (s.lat !== 0 || s.lon !== 0) {
        points.push([s.lat, s.lon])
      }
    })
    if (trip.route_geometry.length > 0) {
      trip.route_geometry.forEach(p => points.push(p))
    }
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [trip, map])

  return null
}

export const TripMap = ({ trip }: TripMapProps) => {
  const { theme } = useTheme()

  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  const routeColor = theme === 'dark' ? '#F59E0B' : '#1E3A5F'

  const center = useMemo((): [number, number] => {
    const validStops = trip.stops.filter(s => s.lat !== 0 || s.lon !== 0)
    if (validStops.length > 0) {
      const avgLat = validStops.reduce((a, s) => a + s.lat, 0) / validStops.length
      const avgLon = validStops.reduce((a, s) => a + s.lon, 0) / validStops.length
      return [avgLat, avgLon]
    }
    return [39.8283, -98.5795] // Center of US
  }, [trip.stops])

  return (
    <div className="h-[300px] lg:h-full w-full rounded-lg overflow-hidden border border-border" id="trip-map">
      <MapContainer
        center={center}
        zoom={5}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />
        {trip.route_geometry.length > 0 && (
          <>
            {/* Outline / Border */}
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
            {/* Inner Line */}
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
    </div>
  )
}
