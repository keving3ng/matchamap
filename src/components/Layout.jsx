import { useLocation } from 'react-router-dom'
import Navigation from './Navigation'

function Layout({ children }) {
  const location = useLocation()
  
  return (
    <div className="min-h-screen bg-cream-100">
      <main className="pb-16 md:pb-0">
        {children}
      </main>
      <Navigation currentPath={location.pathname} />
    </div>
  )
}

export default Layout