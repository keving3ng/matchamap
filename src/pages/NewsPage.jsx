function NewsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-cream-200 px-4 py-4 md:px-6 sticky top-0 md:top-16 z-40">
        <h1 className="text-xl font-bold text-matcha-600">News & Updates</h1>
        <p className="text-sm text-charcoal-600 mt-1">Latest from Toronto's matcha scene</p>
      </div>

      {/* News Feed */}
      <div className="px-4 py-6 md:px-6 max-w-4xl mx-auto space-y-6">
        {/* News Item */}
        {[1, 2, 3].map((i) => (
          <article key={i} className="bg-white rounded-lg border border-cream-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-matcha-200 flex items-center justify-center">
              <span className="text-4xl">📰</span>
            </div>
            <div className="p-4">
              <div className="flex items-center text-sm text-charcoal-500 mb-2">
                <span>📅 January {i + 14}, 2024</span>
                <span className="mx-2">•</span>
                <span>📝 Blog</span>
              </div>
              <h2 className="text-lg font-semibold text-charcoal-900 mb-2">
                New Matcha Cafe Opens in {i === 1 ? 'Kensington Market' : i === 2 ? 'Distillery District' : 'Queen West'}
              </h2>
              <p className="text-charcoal-700 leading-relaxed mb-4">
                We're excited to share news about another amazing addition to Toronto's matcha scene. 
                This new cafe brings authentic Japanese matcha culture to the heart of the city...
              </p>
              <button className="text-matcha-600 font-medium hover:text-matcha-700 focus-ring rounded px-2 py-1">
                Read More →
              </button>
            </div>
          </article>
        ))}

        {/* Featured Update */}
        <div className="bg-matcha-50 border border-matcha-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📢</span>
            <div>
              <h3 className="font-semibold text-matcha-800 mb-1">MatchaMap Updates</h3>
              <p className="text-matcha-700 text-sm">
                We've added 3 new cafes this week and updated ratings for 5 existing locations. 
                Check your passport to see which new spots you haven't visited yet!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsPage