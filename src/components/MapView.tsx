import React from 'react'
import { MapPin, Navigation, X } from 'lucide-react'
import type { MapViewProps } from '../types'

function MapView({ cafes, showPopover, selectedCafe, onPinClick, onViewDetails, onClosePopover }: MapViewProps): JSX.Element {
  return (
    <div className="flex-1 relative bg-green-50">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" className="text-green-200">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Cafe Pins */}
      {cafes.map((cafe) => (
        <button
          key={cafe.id}
          onClick={() => onPinClick(cafe)}
          className="absolute transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform z-10"
          style={{ left: `${cafe.x}%`, top: `${cafe.y}%` }}
        >
          <MapPin size={32} className="text-green-600 fill-green-400 drop-shadow-lg" strokeWidth={2} />
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded text-xs font-semibold text-green-700 shadow-md whitespace-nowrap">
            {cafe.score}
          </div>
        </button>
      ))}

      {/* Popover */}
      {showPopover && selectedCafe && (
        <div className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-20 border-2 border-green-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{selectedCafe.name}</h3>
              <p className="text-sm text-gray-500">{selectedCafe.neighborhood}</p>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded-full font-bold text-lg">
              {selectedCafe.score}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Navigation size={16} className="text-green-600" />
            <span>{selectedCafe.distance} • {selectedCafe.walkTime} walk</span>
          </div>
          <button 
            onClick={() => onViewDetails(selectedCafe)}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md"
          >
            View Details
          </button>
          <button 
            onClick={onClosePopover}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
        <button className="bg-white p-3 rounded-full shadow-lg hover:bg-green-50 transition">
          <MapPin size={20} className="text-green-600" />
        </button>
      </div>

      <div className="absolute right-4 bottom-32 flex flex-col gap-2 z-10">
        <button className="bg-white px-4 py-2 rounded-full shadow-lg text-2xl hover:bg-green-50 transition">+</button>
        <button className="bg-white px-4 py-2 rounded-full shadow-lg text-2xl hover:bg-green-50 transition">−</button>
      </div>
    </div>
  )
}

export default MapView