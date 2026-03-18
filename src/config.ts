const readEnv = (value: string | undefined, fallback: string) => value?.trim() || fallback

export const env = {
  backendApiUrl: readEnv(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8000/api'),
  geocodingApiUrl: readEnv(import.meta.env.VITE_GEOCODING_API_URL, 'https://nominatim.openstreetmap.org'),
  orsApiKey: readEnv(import.meta.env.VITE_ORS_API_KEY, ''),
}

export const config = {
  services: {
    backendApiUrl: env.backendApiUrl,
    geocodingApiUrl: env.geocodingApiUrl,
  },
  integrations: {
    orsApiKey: env.orsApiKey,
  },
}
