import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import { registerShellWorker } from './pwa/register'

const AppShell = React.lazy(() => import('./components/AppShell'))

// Set dynamic page title based on environment
const setPageTitle = () => {
  const isDev = import.meta.env.DEV
  const isPreview = window.location.hostname.includes('pages.dev') && 
                    !window.location.hostname.includes('matchamap.pages.dev')
  
  let title = 'MatchaMap'
  
  if (isDev) {
    title = '[DEV] MatchaMap'
  } else if (isPreview) {
    title = '[PREVIEW] MatchaMap'
  }
  
  document.title = title
}

setPageTitle()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <AppShell />
    </React.Suspense>
  </React.StrictMode>,
)

// Initialize performance monitoring after app mounts
void import('./utils/webVitals').then(({ initWebVitals }) => initWebVitals()).catch(() => undefined)
void import('./utils/analyticsBatcher').then(({ initAnalyticsBatching }) => initAnalyticsBatching()).catch(() => undefined)

if (import.meta.env.PROD) {
  void registerShellWorker(true).catch(() => undefined)
}
