import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { config } from '@/config'

export interface GeocodingLocation {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export const geocodingApi = createApi({
  reducerPath: 'geocodingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.services.geocodingApiUrl,
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json')
      return headers
    },
  }),
  endpoints: (builder) => ({
    searchLocations: builder.query<GeocodingLocation[], string>({
      query: (searchTerm) => ({
        url: '/search',
        params: {
          format: 'json',
          q: searchTerm,
          countrycodes: 'us',
          addressdetails: 1,
          limit: 8,
        },
      }),
    }),
  }),
})

export const { useLazySearchLocationsQuery } = geocodingApi
