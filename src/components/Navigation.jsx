import { Link } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Map', icon: '🗺️' },
  { path: '/list', label: 'List', icon: '📋' },
  { path: '/passport', label: 'Passport', icon: '📖' },
  { path: '/news', label: 'News', icon: '📰' },
  { path: '/about', label: 'About', icon: 'ℹ️' },
]

function Navigation({ currentPath }) {
  return (
    <>
      {/* Mobile Navigation - Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 md:hidden safe-area-inset-bottom">
        <div className="flex justify-around items-center py-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg focus-ring ${
                currentPath === item.path
                  ? 'text-matcha-600'
                  : 'text-charcoal-600 hover:text-matcha-500'
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Navigation - Top Bar */}
      <nav className="hidden md:block bg-white border-b border-cream-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 focus-ring rounded-lg p-2">
              <span className="text-2xl">🍵</span>
              <span className="text-xl font-bold text-matcha-600">MatchaMap</span>
            </Link>
            
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium focus-ring ${
                    currentPath === item.path
                      ? 'text-matcha-600 bg-matcha-50'
                      : 'text-charcoal-600 hover:text-matcha-500 hover:bg-matcha-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navigation