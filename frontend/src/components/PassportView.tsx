import React from 'react'
import { TrendingUp } from 'lucide-react'
import { ContentContainer } from './ContentContainer'
import type { PassportViewProps } from '../types'

export const PassportView: React.FC<PassportViewProps> = ({ cafes, visitedStamps, onToggleStamp }) => {
  const visitedCount: number = visitedStamps.length
  const totalCount: number = cafes.length
  const percentage: number = Math.round((visitedCount / totalCount) * 100)

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
            🎫
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-caveat">Matcha Passport</h2>
            <p className="text-sm text-gray-600">Collect stamps from every location</p>
          </div>
        </div>
      </div>

      <ContentContainer maxWidth="lg">
        {/* Progress Card */}
        <div className="px-4 py-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Your Progress</p>
              <p className="text-4xl font-bold">{visitedCount}/{totalCount}</p>
            </div>
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <p className="text-3xl font-bold">{percentage}%</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            {percentage >= 50 ? <TrendingUp size={20} /> : <span className="text-lg">🍵</span>}
            <p className="text-sm font-semibold">
              {percentage >= 50 ? `${visitedStamps.length} of ${cafes.length} visited` : 'Start exploring'}
            </p>
          </div>
        </div>
      </div>

      {/* Collection Grid */}
      <div className="px-4 pb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Collection</h3>
        <div className="grid grid-cols-3 gap-4">
          {cafes.map((cafe) => {
            const isVisited = visitedStamps.includes(cafe.id)

            return (
              <button
                key={cafe.id}
                onClick={() => onToggleStamp(cafe.id)}
                className={`aspect-square rounded-2xl shadow-md transition-all transform active:scale-95 ${
                  isVisited ? 'scale-100 shadow-lg' : 'opacity-40 grayscale scale-95'
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                  {isVisited && (
                    <div className="absolute inset-0 border-4 border-white/40 rounded-2xl pointer-events-none" />
                  )}

                  <div className="text-4xl mb-2 drop-shadow-md">🍵</div>
                  <p className="text-white font-bold text-xs text-center leading-tight drop-shadow-md">
                    {cafe.name}
                  </p>
                  {cafe.displayScore && (
                    <div className="mt-1.5 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full">
                      <p className="text-xs font-bold text-gray-800">{cafe.displayScore.toFixed(1)}</p>
                    </div>
                  )}

                  {isVisited && (
                    <div className="absolute top-1 right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                      <span className="text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        </div>
      </ContentContainer>
    </div>
  )
}

export default PassportView