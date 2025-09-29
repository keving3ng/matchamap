import React from 'react'
import { Navigation, MapPin, ChevronDown } from 'lucide-react'
import type { ListViewProps } from '../types'

function ListView({ cafes, expandedCard, onToggleExpand, onViewDetails }: ListViewProps): JSX.Element {
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Filter Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-green-600 text-white whitespace-nowrap">
            Rating
          </button>
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 whitespace-nowrap">
            Distance
          </button>
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 whitespace-nowrap">
            Area
          </button>
        </div>
      </div>

      {/* Cafe List */}
      <div className="px-4 py-4 space-y-3">
        {cafes.map((cafe) => (
          <div key={cafe.id} className="bg-white rounded-2xl shadow-md border-2 border-green-100 overflow-hidden">
            <button 
              onClick={() => onToggleExpand(expandedCard === cafe.id ? null : cafe.id)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-gray-800">{cafe.name}</h3>
                  <div className="bg-green-500 text-white px-2.5 py-0.5 rounded-full font-bold text-sm">
                    {cafe.score}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium">{cafe.neighborhood}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Navigation size={14} />
                    {cafe.distance}
                  </span>
                </div>
              </div>
              <ChevronDown 
                size={24} 
                className={`text-green-600 transition-transform ${
                  expandedCard === cafe.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedCard === cafe.id && (
              <div className="px-4 pb-4 border-t-2 border-green-100 pt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{cafe.address}</p>
                      <p className="text-xs text-gray-500">{cafe.walkTime} walk</p>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-gray-700 italic">"{cafe.quickNote}"</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => onViewDetails(cafe)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md text-sm"
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ListView