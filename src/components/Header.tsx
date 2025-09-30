import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Menu, Instagram } from 'lucide-react'

interface HeaderProps {
  isMenuEnabled?: boolean
}

export const Header: React.FC<HeaderProps> = ({ isMenuEnabled = false }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine current view from URL path
  const currentView = location.pathname === '/list' ? 'list'
    : location.pathname === '/feed' ? 'feed'
    : location.pathname === '/passport' ? 'passport'
    : location.pathname === '/events' ? 'events'
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl">🍵</span>
            </div>
            <h1 className="text-xl font-bold tracking-wide">MatchaMap</h1>
          </div>
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
          {isMenuEnabled && (
            <button className="p-2 hover:bg-green-700 rounded-lg transition">
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header
