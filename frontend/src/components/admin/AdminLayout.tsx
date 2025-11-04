import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { Settings, Menu, X, Coffee, Calendar, Code, Users, Package, Wrench, Upload, Mail, FileText, ShieldCheck } from '@/components/icons'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

// Core admin functions - frequently used
const coreNavItems: NavItem[] = [
  {
    id: 'cafes',
    label: 'Cafes',
    icon: <Coffee size={20} />,
    path: '/admin/cafes',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Users size={20} />,
    path: '/admin/users',
  },
  {
    id: 'moderation',
    label: 'Moderation',
    icon: <ShieldCheck size={20} />,
    path: '/admin/moderation',
  },
  {
    id: 'content',
    label: 'Content',
    icon: <FileText size={20} />,
    path: '/admin/content',
  },
  {
    id: 'events',
    label: 'Events',
    icon: <Calendar size={20} />,
    path: '/admin/events',
  },
  {
    id: 'waitlist',
    label: 'Waitlist',
    icon: <Mail size={20} />,
    path: '/admin/waitlist',
  },
]

// Secondary tools and utilities
const toolsNavItems: NavItem[] = [
  {
    id: 'import',
    label: 'Bulk Import',
    icon: <Upload size={20} />,
    path: '/admin/import',
  },
  {
    id: 'products',
    label: 'Products',
    icon: <Package size={20} />,
    path: '/admin/products',
  },
  {
    id: 'api',
    label: 'API',
    icon: <Code size={20} />,
    path: '/admin/api',
  },
  {
    id: 'misc',
    label: 'Misc',
    icon: <Wrench size={20} />,
    path: '/admin/misc',
  },
]

// Settings and configuration - rarely used
const settingsNavItems: NavItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={20} />,
    path: '/admin/settings',
  },
]

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/admin/cafes') {
      // Make cafes active for root /admin path too
      return location.pathname === '/admin' || location.pathname.startsWith(path)
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
      } md:flex w-full md:w-64 bg-white border-r border-gray-200 shadow-xs flex-col overflow-y-auto`}>
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
        <nav className="flex-1 p-4 space-y-6">
          {/* Core Functions Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Core Functions
            </h3>
            <ul className="space-y-2">
              {coreNavItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      navigate(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-green-100 text-green-700 font-semibold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Tools & Utilities
            </h3>
            <ul className="space-y-2">
              {toolsNavItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      navigate(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-green-100 text-green-700 font-semibold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Settings Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Configuration
            </h3>
            <ul className="space-y-2">
              {settingsNavItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      navigate(item.path)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-green-100 text-green-700 font-semibold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
