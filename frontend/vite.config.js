import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/institutes': 'http://127.0.0.1:8000',
      '/students': 'http://127.0.0.1:8000',
      '/faculty': 'http://127.0.0.1:8000',
      '/admin': 'http://127.0.0.1:8000',
      '/courses': 'http://127.0.0.1:8000',
      '/batches': 'http://127.0.0.1:8000',
      '/attendance': 'http://127.0.0.1:8000',
      '/fees': 'http://127.0.0.1:8000',
      '/assessments': 'http://127.0.0.1:8000',
      '/notices': 'http://127.0.0.1:8000',
      '/reports': 'http://127.0.0.1:8000',
      '/certificates': 'http://127.0.0.1:8000',
      '/course-applications': 'http://127.0.0.1:8000',
      '/ai': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000'
    }
  }
})
