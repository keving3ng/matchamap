import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import AdminWrapper from './components/AdminWrapper'
import { initWebVitals } from './utils/webVitals'
import { initAnalyticsBatching } from './utils/analyticsBatcher'
import './styles/index.css'

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
    <BrowserRouter>
      <AdminWrapper>
        <App />
      </AdminWrapper>
    </BrowserRouter>
  </React.StrictMode>,
)

// Initialize performance monitoring after app mounts
initWebVitals()
initAnalyticsBatching()