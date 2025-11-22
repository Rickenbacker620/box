export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787',
  apiToken: import.meta.env.VITE_API_TOKEN || 'supersecret',
} as const
