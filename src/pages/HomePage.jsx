function HomePage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-cream-200 px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-matcha-600 md:hidden">MatchaMap</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg bg-matcha-100 text-matcha-700 hover:bg-matcha-200 focus-ring">
              <span className="sr-only">Toggle view</span>
              📍
            </button>
            <button className="p-2 rounded-lg bg-cream-200 text-charcoal-600 hover:bg-cream-300 focus-ring">
              <span className="sr-only">Center on location</span>
              🎯
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div id="map" className="w-full h-full bg-cream-200 flex items-center justify-center">
          <div className="text-center text-charcoal-500">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-lg font-medium">Interactive Map</p>
            <p className="text-sm">Map component will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage