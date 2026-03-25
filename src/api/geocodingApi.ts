import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { config } from '@/config'

export interface GeocodingLocation {
  place_id: number | string
  display_name: string
  lat: string
  lon: string
}

interface OrsFeature {
  geometry?: {
    coordinates?: [number, number]
  }
  properties?: {
    label?: string
  }
}

interface MapboxFeature {
  geometry?: {
    coordinates?: [number, number]
  }
  properties?: {
    mapbox_id?: string
    full_address?: string
    name?: string
    place_formatted?: string
  }
}

const normalizeQuery = (value: string) => value.trim().toLowerCase()
const MAX_PROVIDER_RESULTS = 20
const MAX_DISPLAY_RESULTS = 16

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const CURATED_US_LOCATIONS: GeocodingLocation[] = [
  { place_id: 100001, display_name: 'New York, New York, United States', lat: '40.7128', lon: '-74.0060' },
  { place_id: 100002, display_name: 'Newark, New Jersey, United States', lat: '40.7357', lon: '-74.1724' },
  { place_id: 100003, display_name: 'New Orleans, Louisiana, United States', lat: '29.9511', lon: '-90.0715' },
  { place_id: 100004, display_name: 'New Haven, Connecticut, United States', lat: '41.3083', lon: '-72.9279' },
  { place_id: 100005, display_name: 'New Bedford, Massachusetts, United States', lat: '41.6362', lon: '-70.9342' },
  { place_id: 100006, display_name: 'New Braunfels, Texas, United States', lat: '29.7030', lon: '-98.1245' },
  { place_id: 100007, display_name: 'New Britain, Connecticut, United States', lat: '41.6612', lon: '-72.7795' },
  { place_id: 100008, display_name: 'New Rochelle, New York, United States', lat: '40.9115', lon: '-73.7824' },
  { place_id: 100009, display_name: 'Newport News, Virginia, United States', lat: '37.0871', lon: '-76.4730' },
  { place_id: 100010, display_name: 'Newport, Rhode Island, United States', lat: '41.4901', lon: '-71.3128' },
  { place_id: 100011, display_name: 'New Jersey, United States', lat: '40.0583', lon: '-74.4057' },
  { place_id: 100012, display_name: 'New Mexico, United States', lat: '34.5199', lon: '-105.8701' },
  { place_id: 100013, display_name: 'New Albany, Indiana, United States', lat: '38.2856', lon: '-85.8241' },
  { place_id: 100014, display_name: 'New Castle, Delaware, United States', lat: '39.6621', lon: '-75.5663' },
]

const scoreLocation = (query: string, displayName: string) => {
  const normalizedQuery = normalizeQuery(query)
  const normalizedDisplay = normalizeQuery(displayName)
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const firstSegment = normalizedDisplay.split(',')[0]?.trim() ?? normalizedDisplay
  const wholeQueryRegex = new RegExp(`\\b${escapeRegex(normalizedQuery)}\\b`)
  const queryPrefixRegex = new RegExp(`\\b${escapeRegex(normalizedQuery)}`)

  let score = 0

  if (firstSegment === normalizedQuery) {
    score += 420
  }

  if (normalizedDisplay.startsWith(normalizedQuery)) {
    score += 260
  }

  if (queryPrefixRegex.test(firstSegment)) {
    score += 220
  }

  if (wholeQueryRegex.test(firstSegment)) {
    score += 180
  }

  if (normalizedDisplay.includes(normalizedQuery)) {
    score += 140
  }

  const commaPrefix = `${normalizedQuery},`
  if (normalizedDisplay.startsWith(commaPrefix)) {
    score += 40
  }

  tokens.forEach((token) => {
    const wholeTokenRegex = new RegExp(`\\b${escapeRegex(token)}\\b`)
    const tokenPrefixRegex = new RegExp(`\\b${escapeRegex(token)}`)

    if (tokenPrefixRegex.test(firstSegment)) {
      score += 70
    } else if (wholeTokenRegex.test(normalizedDisplay)) {
      score += 36
    } else if (normalizedDisplay.includes(token)) {
      score += 16
    }
  })

  if (firstSegment.startsWith(normalizedQuery)) {
    score += 110
  } else if (firstSegment.includes(normalizedQuery)) {
    score += 35
  }

  return score - normalizedDisplay.length * 0.02
}

const dedupeLocations = (locations: GeocodingLocation[]) => {
  const seen = new Set<string>()
  const results: GeocodingLocation[] = []

  locations.forEach((location) => {
    const key = `${normalizeQuery(location.display_name)}|${location.lat}|${location.lon}`
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    results.push(location)
  })

  return results
}

function getCuratedLocations(searchTerm: string): GeocodingLocation[] {
  const normalized = normalizeQuery(searchTerm)
  if (!normalized) {
    return []
  }

  return CURATED_US_LOCATIONS.filter((location) => normalizeQuery(location.display_name).includes(normalized))
}

async function fetchOrsLocations(searchTerm: string): Promise<GeocodingLocation[]> {
  if (!config.integrations.orsApiKey) {
    return []
  }

  const params = new URLSearchParams({
    api_key: config.integrations.orsApiKey,
    text: searchTerm,
    'boundary.country': 'US',
    size: String(MAX_PROVIDER_RESULTS),
  })

  const response = await fetch(`https://api.openrouteservice.org/geocode/autocomplete?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('ORS autocomplete failed')
  }

  const payload = await response.json() as { features?: OrsFeature[] }

  return (payload.features ?? [])
    .map<GeocodingLocation | null>((feature, index) => {
      const coords = feature.geometry?.coordinates
      const label = feature.properties?.label
      if (!coords || !label) {
        return null
      }

      return {
        place_id: index + 1,
        display_name: label,
        lat: String(coords[1]),
        lon: String(coords[0]),
      }
    })
    .filter((item): item is GeocodingLocation => Boolean(item))
}

async function fetchMapboxLocations(searchTerm: string): Promise<GeocodingLocation[]> {
  if (!config.integrations.mapboxAccessToken) {
    return []
  }

  const params = new URLSearchParams({
    access_token: config.integrations.mapboxAccessToken,
    q: searchTerm,
    country: 'US',
    language: 'en',
    limit: String(MAX_PROVIDER_RESULTS),
  })

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Mapbox search failed')
  }

  const payload = await response.json() as { features?: MapboxFeature[] }

  return (payload.features ?? [])
    .map<GeocodingLocation | null>((feature, index) => {
      const coords = feature.geometry?.coordinates
      const properties = feature.properties
      const displayName = properties?.full_address
        ?? [properties?.name, properties?.place_formatted].filter(Boolean).join(', ')

      if (!coords || !displayName) {
        return null
      }

      return {
        place_id: properties?.mapbox_id ?? `mapbox-${index}`,
        display_name: displayName,
        lat: String(coords[1]),
        lon: String(coords[0]),
      }
    })
    .filter((item): item is GeocodingLocation => Boolean(item))
}

async function fetchNominatimLocations(searchTerm: string): Promise<GeocodingLocation[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: searchTerm,
    countrycodes: 'us',
    addressdetails: '1',
    limit: String(MAX_PROVIDER_RESULTS),
  })

  const response = await fetch(`${config.services.geocodingApiUrl}/search?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Nominatim lookup failed')
  }

  return await response.json() as GeocodingLocation[]
}

export const geocodingApi = createApi({
  reducerPath: 'geocodingApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    searchLocations: builder.query<GeocodingLocation[], string>({
      async queryFn(searchTerm) {
        const trimmed = searchTerm.trim()
        if (trimmed.length < 2) {
          return { data: [] }
        }

        try {
          const [mapboxResult, orsResult] = await Promise.allSettled([
            fetchMapboxLocations(trimmed),
            fetchOrsLocations(trimmed),
          ])

          const mapboxLocations = mapboxResult.status === 'fulfilled' ? mapboxResult.value : []
          const orsLocations = orsResult.status === 'fulfilled' ? orsResult.value : []
          const curatedLocations = getCuratedLocations(trimmed)
          const merged = dedupeLocations([...curatedLocations, ...mapboxLocations, ...orsLocations])
            .sort((left, right) => scoreLocation(trimmed, right.display_name) - scoreLocation(trimmed, left.display_name))
            .slice(0, MAX_DISPLAY_RESULTS)

          return { data: merged }
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error: error instanceof Error ? error.message : 'Location search failed',
            },
          }
        }
      },
    }),
  }),
})

export const { useLazySearchLocationsQuery } = geocodingApi
