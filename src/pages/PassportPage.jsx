function PassportPage() {
  const visitedCount = 3
  const totalCount = 12
  const progressPercentage = (visitedCount / totalCount) * 100

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-cream-200 px-4 py-4 md:px-6 sticky top-0 md:top-16 z-40">
        <h1 className="text-xl font-bold text-matcha-600">Matcha Passport</h1>
        <p className="text-sm text-charcoal-600 mt-1">Track your matcha journey</p>
      </div>

      <div className="px-4 py-6 md:px-6 max-w-4xl mx-auto space-y-6">
        {/* Progress Overview */}
        <div className="bg-white rounded-lg border border-cream-200 p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">📖</div>
            <h2 className="text-2xl font-bold text-charcoal-900 mb-2">Your Progress</h2>
            <p className="text-charcoal-600">
              {visitedCount} of {totalCount} cafes visited
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-charcoal-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-cream-200 rounded-full h-3">
              <div 
                className="bg-matcha-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-matcha-600">{visitedCount}</div>
              <div className="text-sm text-charcoal-600">Visited</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-charcoal-400">{totalCount - visitedCount}</div>
              <div className="text-sm text-charcoal-600">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-pink">4.3</div>
              <div className="text-sm text-charcoal-600">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Visited Cafes */}
        <div className="bg-white rounded-lg border border-cream-200 p-4">
          <h3 className="text-lg font-semibold text-charcoal-900 mb-4">Recently Visited</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-matcha-50 rounded-lg">
                <span className="text-2xl">✓</span>
                <div className="flex-1">
                  <h4 className="font-medium text-charcoal-900">Cafe Name {i}</h4>
                  <p className="text-sm text-charcoal-600">Visited Jan {i + 15}, 2024</p>
                </div>
                <div className="text-matcha-600 font-medium">★ 4.{i}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-white rounded-lg border border-cream-200 p-4">
          <h3 className="text-lg font-semibold text-charcoal-900 mb-4">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-matcha-50 rounded-lg">
              <div className="text-2xl mb-1">🥇</div>
              <div className="text-sm font-medium text-charcoal-900">First Visit</div>
            </div>
            <div className="text-center p-3 bg-cream-100 rounded-lg opacity-50">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-sm font-medium text-charcoal-900">5 Cafes</div>
            </div>
            <div className="text-center p-3 bg-cream-100 rounded-lg opacity-50">
              <div className="text-2xl mb-1">🌟</div>
              <div className="text-sm font-medium text-charcoal-900">Explorer</div>
            </div>
            <div className="text-center p-3 bg-cream-100 rounded-lg opacity-50">
              <div className="text-2xl mb-1">👑</div>
              <div className="text-sm font-medium text-charcoal-900">Completionist</div>
            </div>
          </div>
        </div>

        {/* Next Recommendations */}
        <div className="bg-white rounded-lg border border-cream-200 p-4">
          <h3 className="text-lg font-semibold text-charcoal-900 mb-4">Recommended Next</h3>
          <div className="space-y-3">
            {[4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border border-cream-200 rounded-lg hover:bg-cream-50">
                <span className="text-2xl">🍵</span>
                <div className="flex-1">
                  <h4 className="font-medium text-charcoal-900">Cafe Name {i}</h4>
                  <p className="text-sm text-charcoal-600">0.{i} km away • ★ 4.{i}</p>
                </div>
                <button className="text-matcha-600 font-medium hover:text-matcha-700 focus-ring rounded px-2 py-1">
                  View →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PassportPage