import { baseApi } from "./baseApi"
import type { Trip, TripCreatePayload } from "@/types/trip"

export const tripsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTrip: builder.mutation<Trip, TripCreatePayload>({
      query: (body) => ({
        url: "/trips/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Trip"],
    }),

    getTrip: builder.query<Trip, string>({
      query: (id) => `/trips/${id}/`,
      providesTags: (_, __, id) => [{ type: "Trip", id }],
    }),

    listTrips: builder.query<Trip[], void>({
      query: () => "/trips/",
      providesTags: ["Trip"],
    }),
  }),
})

export const {
  useCreateTripMutation,
  useGetTripQuery,
  useListTripsQuery,
} = tripsApi
