import { baseApi } from "./baseApi"
import type { PaginatedResponse, Trip, TripCreatePayload, TripHistoryItem } from "@/types/trip"

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

    listTrips: builder.query<PaginatedResponse<TripHistoryItem>, { page?: number; pageSize?: number } | void>({
      query: (params) => ({
        url: "/trips/",
        params: {
          page: params?.page ?? 1,
          page_size: params?.pageSize ?? 5,
        },
      }),
      providesTags: ["Trip"],
    }),
  }),
})

export const {
  useCreateTripMutation,
  useGetTripQuery,
  useListTripsQuery,
} = tripsApi
