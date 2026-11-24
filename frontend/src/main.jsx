import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { initNativeShell, isNativeApp } from './lib/native.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

// Status bar and splash handling only exist inside the Capacitor shell.
initNativeShell()

// The shell is cacheable; API responses and photos are never cached by the
// service worker. Registration is production-only so dev HMR stays untouched.
// The native shell is skipped: its bundle is already local and its WebView's
// service worker support is inconsistent.
if (import.meta.env.PROD && !isNativeApp() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
