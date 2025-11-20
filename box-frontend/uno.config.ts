import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(), // Basic preset with common utilities
  ],
  theme: {
    colors: {
      // Simple black and white palette
      primary: '#000000',
      secondary: '#666666',
      background: '#ffffff',
      surface: '#f5f5f5',
      border: '#e0e0e0',
      text: '#000000',
      'text-secondary': '#666666',
    },
  },
})