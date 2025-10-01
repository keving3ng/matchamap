import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, ToggleLeft, Menu, X } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

const navItems: NavItem[] = [
  {
    id: 'overrides',
    label: 'Feature Toggles',
    icon: <ToggleLeft size={20} />,
    path: '/admin',
  },
  // Add more nav items here in the future
  // {
  //   id: 'analytics',
  //   label: 'Analytics',
  //   icon: <BarChart size={20} />,
  //   path: '/admin/analytics',
  // },
]

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-green-50 to-green-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-700">
          <Settings size={20} />
          <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation - Hidden on mobile unless menu is open */}
      <div className={`${
        mobileMenuOpen ? 'flex' : 'hidden'
      } md:flex w-full md:w-64 bg-white border-r border-gray-200 shadow-lg flex-col`}>
        {/* Sidebar Header - Desktop only */}
        <div className="hidden md:block p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-green-700">
            <Settings size={24} />
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Configuration & Tools
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    navigate(item.path)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-green-100 text-green-700 font-semibold shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="font-semibold mb-1">Development Tools</p>
            <p>Toggle features and test configurations</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export default AdminLayout
