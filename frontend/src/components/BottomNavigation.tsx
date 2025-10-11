import React from 'react'
import { useNavigate, useLocation } from 'react-router'
import { MapPin, List, User, Newspaper, Calendar } from 'lucide-react'
import { getCurrentEnvironment } from '../hooks/useFeatureToggle'
import { useAppFeatures } from '../hooks/useAppFeatures'

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentEnv = getCurrentEnvironment()

  const { isPassportEnabled, isFeedEnabled, isEventsEnabled } = useAppFeatures()

  // Check if admin banner is shown (only in dev mode)
  const hasAdminBanner = currentEnv === 'dev'

  // Determine current view from URL path
  const currentView = location.pathname === '/list' ? 'list'
    : location.pathname === '/feed' ? 'feed'
    : location.pathname === '/passport' ? 'passport'
    : location.pathname === '/events' ? 'events'
    : location.pathname.startsWith('/cafe/') ? 'detail'
    : 'map'

  return (
    <div
      className="bg-white border-t-2 border-green-200 px-6 py-3 shadow-lg"
      style={{
        paddingBottom: hasAdminBanner ? 'calc(0.75rem + var(--admin-banner-height, 0px))' : '0.75rem'
      }}
    >
      <div className="flex justify-around items-center">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 transition ${
            currentView === 'map' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <MapPin size={24} strokeWidth={currentView === 'map' ? 2.5 : 2} />
          <span className={`text-xs ${currentView === 'map' ? 'font-semibold' : ''}`}>Map</span>
        </button>
        <button
          onClick={() => navigate('/list')}
          className={`flex flex-col items-center gap-1 transition ${
            currentView === 'list' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <List size={24} strokeWidth={currentView === 'list' ? 2.5 : 2} />
          <span className={`text-xs ${currentView === 'list' ? 'font-semibold' : ''}`}>List</span>
        </button>
        {isFeedEnabled && (
          <button
            onClick={() => navigate('/feed')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'feed' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <Newspaper size={24} strokeWidth={currentView === 'feed' ? 2.5 : 2} />
            <span className={`text-xs ${currentView === 'feed' ? 'font-semibold' : ''}`}>Feed</span>
          </button>
        )}
        {isEventsEnabled && (
          <button
            onClick={() => navigate('/events')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'events' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <Calendar size={24} strokeWidth={currentView === 'events' ? 2.5 : 2} />
            <span className={`text-xs ${currentView === 'events' ? 'font-semibold' : ''}`}>Events</span>
          </button>
        )}
        {isPassportEnabled && (
          <button
            onClick={() => navigate('/passport')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'passport' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <User size={24} strokeWidth={currentView === 'passport' ? 2.5 : 2} />
            <span className={`text-xs ${currentView === 'passport' ? 'font-semibold' : ''}`}>Passport</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default BottomNavigation
