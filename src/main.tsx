import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import AdminWrapper from './components/AdminWrapper'
import { FeatureProvider } from './contexts/FeatureContext'
import './styles/index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <FeatureProvider>
        <AdminWrapper>
          <App />
        </AdminWrapper>
      </FeatureProvider>
    </BrowserRouter>
  </React.StrictMode>,
)