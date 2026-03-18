import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { config } from "@/config"

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: config.services.backendApiUrl }),
  tagTypes: ["Trip"],
  endpoints: () => ({}),
})
