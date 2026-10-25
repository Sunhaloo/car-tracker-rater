import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/lib/api` ==> `src/lib/api` ( same alias as in `jsconfig.json` )
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    rolldownOptions: {
      output: {
        // the two big libraries get their own files ==> smaller downloads, cached separately
        codeSplitting: {
          groups: [
            { name: 'charts', test: /node_modules[\\/](recharts|d3-|victory-vendor)/ },
            { name: 'map', test: /node_modules[\\/](leaflet|react-leaflet|@react-leaflet)/ },
          ],
        },
      },
    },
  },
})
