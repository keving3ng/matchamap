import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Menu, Instagram, Settings } from 'lucide-react'
import { CitySelector } from './CitySelector'
import { useFeatures } from '../contexts/FeatureContext'
import { useFeatureToggle } from '../hooks/useFeatureToggle'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { isMenuEnabled, isCitySelectorEnabled } = useFeatures()
  const isAdminEnabled = useFeatureToggle('ENABLE_ADMIN_PANEL')

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Determine current view from URL path
  const currentView = location.pathname === '/list' ? 'list'
    : location.pathname === '/feed' ? 'feed'
    : location.pathname === '/passport' ? 'passport'
    : location.pathname === '/events' ? 'events'
    : location.pathname === '/admin' ? 'admin'
    : location.pathname.startsWith('/cafe/') ? 'detail'
    : 'map'

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentView === 'detail' && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-green-700 rounded-lg transition"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:bg-green-700 rounded-lg px-2 py-1 transition"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">🍵</span>
            </div>
            <h1 className="text-xl font-bold tracking-wide">MatchaMap</h1>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Social Links */}
          <a
            href="https://www.instagram.com/vivisual.diary"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-green-700 rounded-lg transition flex items-center justify-center"
            aria-label="Instagram"
          >
            <Instagram size={20} />
          </a>
          <a
            href="https://www.tiktok.com/@vivisual.diary"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-green-700 rounded-lg transition flex items-center justify-center"
            aria-label="TikTok"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                fill="currentColor"
              />
            </svg>
          </a>
          {isCitySelectorEnabled && (
            <CitySelector />
          )}
          {isMenuEnabled && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-green-700 rounded-lg transition"
              >
                <Menu size={24} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-[9999]">
                  {isAdminEnabled && (
                    <button
                      onClick={() => {
                        navigate('/admin')
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-green-50 flex items-center gap-2 transition"
                    >
                      <Settings size={18} />
                      <span>Admin</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header
