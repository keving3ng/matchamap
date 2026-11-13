import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'
import AdminWrapper from './AdminWrapper'
import '../utils/api'

export const AppShell: React.FC = () => (
  <BrowserRouter>
    <AdminWrapper>
      <App />
    </AdminWrapper>
  </BrowserRouter>
)

export default AppShell
