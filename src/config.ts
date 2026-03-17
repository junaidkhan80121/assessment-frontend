// Global configuration for the application using Vite environment variables
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  ORS_API_KEY: import.meta.env.VITE_ORS_API_KEY || '',
};
