import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// Global error handler to catch uncaught errors that might cause black screen
window.onerror = function(message, source, lineno, colno, error) {
  console.error('🚨 UNCAUGHT ERROR:', {
    message,
    source,
    line: lineno,
    column: colno,
    error,
    stack: error?.stack
  })
  return false // Don't prevent default error handling
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('🚨 UNHANDLED PROMISE REJECTION:', {
    reason: event.reason,
    promise: event.promise
  })
})

console.log('🔄 Starting BDC Thrive application...')
console.log('🔄 Environment check:', {
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  nodeEnv: import.meta.env.NODE_ENV,
  mode: import.meta.env.MODE
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found in DOM')
  throw new Error('Root element not found')
}

console.log('✅ Root element found, initializing React...')

try {
  const root = createRoot(rootElement)
  console.log('✅ React root created, rendering app...')
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
  console.log('✅ App rendered successfully')
} catch (error) {
  console.error('❌ Critical error during React initialization:', error)
  // Fallback error display
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-family: system-ui;">
      <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
        <p style="color: #374151; margin-bottom: 1rem;">Failed to start the application. Please check the console for details.</p>
        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p style="color: #6b7280; font-size: 0.75rem; margin-bottom: 1rem;">Check browser console (F12 or Cmd+Option+C) for detailed error information</p>
        <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
          Reload Page
        </button>
      </div>
    </div>
  `
}