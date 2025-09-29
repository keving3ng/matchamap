function ListPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-cream-200 px-4 py-4 md:px-6 sticky top-0 md:top-16 z-40">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-matcha-600">Cafe List</h1>
          <button className="p-2 rounded-lg bg-matcha-100 text-matcha-700 hover:bg-matcha-200 focus-ring">
            <span className="sr-only">Filter</span>
            🔍
          </button>
        </div>
        
        {/* Filter/Sort Controls */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button className="px-3 py-2 bg-matcha-500 text-white rounded-lg text-sm font-medium whitespace-nowrap">
            All Cafes
          </button>
          <button className="px-3 py-2 bg-cream-200 text-charcoal-600 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-cream-300 focus-ring">
            By Rating
          </button>
          <button className="px-3 py-2 bg-cream-200 text-charcoal-600 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-cream-300 focus-ring">
            By Distance
          </button>
          <button className="px-3 py-2 bg-cream-200 text-charcoal-600 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-cream-300 focus-ring">
            By Neighborhood
          </button>
        </div>
      </div>

      {/* Cafe List */}
      <div className="px-4 py-4 md:px-6 space-y-4">
        {/* Placeholder Cafe Cards */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-cream-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-3">
              <div className="w-16 h-16 bg-matcha-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🍵</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-charcoal-900 truncate">Cafe Name {i}</h3>
                <p className="text-sm text-charcoal-600 mt-1">Neighborhood</p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <span className="text-matcha-500 text-sm">★★★★☆</span>
                    <span className="text-sm text-charcoal-600 ml-1">4.{i}</span>
                  </div>
                  <span className="text-sm text-charcoal-500">0.{i} km</span>
                </div>
              </div>
              <button className="p-2 text-charcoal-400 hover:text-matcha-500 focus-ring rounded">
                <span className="sr-only">View details</span>
                →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ListPage