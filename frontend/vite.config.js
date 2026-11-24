import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const backend = 'http://localhost:5000'

const proxy = {
  '/api': backend,
  '/uploads': backend
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The APK needs an absolute API origin. Fail the build instead of silently
  // shipping a bundle that requests /api from the local WebView origin.
  if (mode === 'android' && !env.VITE_API_URL) {
    throw new Error(
      'VITE_API_URL is missing. Copy frontend/.env.android.example to ' +
        'frontend/.env.android and set the deployed API URL.'
    )
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
      proxy
    },
    preview: {
      proxy
    }
  }
})
