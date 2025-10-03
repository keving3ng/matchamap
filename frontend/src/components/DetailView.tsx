import React, { useState } from 'react'
import { MapPin, Navigation, Heart, CheckCircle, Instagram, ChevronDown, ChevronUp } from 'lucide-react'
import { useFeatureStore } from '../stores/featureStore'
import { getMapsUrl } from '../utils/mapsUrl'
import { ContentContainer } from './ContentContainer'
import { formatHoursCompact } from '../utils/formatHours'
import type { DetailViewProps } from '../types'

export const DetailView: React.FC<DetailViewProps> = ({ cafe, visitedLocations, onToggleVisited }) => {
  const { isPassportEnabled, isUserAccountsEnabled } = useFeatureStore()
  const isVisited: boolean = visitedLocations.includes(cafe.id)
  const mapsUrl = getMapsUrl(cafe.address, cafe.googleMapsUrl)
  const [showAllHours, setShowAllHours] = useState(false)

  const hoursData = cafe.hours ? formatHoursCompact(cafe.hours) : null

  return (
    <div className="flex-1 overflow-y-auto pb-24 pt-0">
      {/* Hero Section */}
      <div className={`w-full h-48 bg-gradient-to-br ${cafe.color || 'from-green-400 to-green-600'} flex items-center justify-center relative`}>
        <span className="text-8xl">{cafe.emoji || '🍵'}</span>
        {isUserAccountsEnabled && (
          <button className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition">
            <Heart size={24} className="text-green-600" />
          </button>
        )}
      </div>

      <ContentContainer maxWidth="md">
        <div className="px-4 relative">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-lg -mt-6 p-5 border-2 border-green-100 relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{cafe.name}</h2>
              <p className="text-gray-600 mt-1">{cafe.neighborhood}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-bold text-2xl shadow-md">
              {cafe.score}
            </div>
          </div>

          <div className="flex items-start gap-2 text-gray-700 mb-2">
            <MapPin size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{cafe.address}</span>
          </div>

            {cafe.distanceInfo && (
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <Navigation size={16} className="text-green-600" />
                <span className="text-sm">{cafe.distanceInfo.formattedKm} away • {cafe.distanceInfo.walkTime} walk</span>
              </div>
            )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition shadow-md flex items-center justify-center gap-2"
          >
            <Navigation size={20} />
            Get Directions
          </a>
        </div>

        {/* Visited Checkbox - Only show if passport is enabled */}
        {isPassportEnabled && (
          <div className="mt-4 bg-green-50 rounded-xl p-4 border-2 border-green-200">
            <button
              onClick={() => onToggleVisited(cafe.id)}
              className="flex items-center gap-3 w-full"
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
                isVisited ? 'bg-green-600 border-green-600' : 'border-green-400'
              }`}>
                {isVisited && <CheckCircle size={20} className="text-white" strokeWidth={3} />}
              </div>
              <span className="font-semibold text-gray-700">
                {isVisited ? "Visited! ✓" : "Mark as visited (Matcha Passport)"}
              </span>
            </button>
          </div>
        )}

        {/* Review Section */}
        {cafe.review && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Expert Review</h3>
            <div className="bg-white rounded-xl shadow p-4 border border-green-100">
              <p className="text-gray-700 leading-relaxed">{cafe.review}</p>
            </div>
          </div>
        )}

        {/* Additional Info Sections */}
        {hoursData && hoursData.allHours.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Hours</h3>
            <div className="bg-white rounded-xl shadow p-4 border border-green-100">
              {/* Today's hours - always show */}
              {hoursData.todayHours && (
                <div className="mb-2">
                  <span className="font-semibold text-green-600">Today: </span>
                  <span className="text-gray-700">{hoursData.todayHours.split(': ')[1]}</span>
                </div>
              )}

              {/* Full week hours - expandable */}
              {hoursData.allHours.length > 1 && (
                <>
                  <button
                    onClick={() => setShowAllHours(!showAllHours)}
                    className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 mt-2"
                  >
                    {showAllHours ? (
                      <>
                        <ChevronUp size={16} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Show full week
                      </>
                    )}
                  </button>

                  {showAllHours && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                      {hoursData.allHours.map((hours, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          {hours}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {cafe.menuHighlights && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Menu Highlights</h3>
            <div className="bg-white rounded-xl shadow p-4 border border-green-100">
              <p className="text-gray-700">{cafe.menuHighlights}</p>
            </div>
          </div>
        )}

        {/* Social Media */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Social Media</h3>
          <div className="flex gap-3">
            {cafe.instagram && (
              <a href="#" className="flex-1 bg-gradient-to-br from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition">
                <Instagram size={20} />
                Instagram
              </a>
            )}
            {cafe.tiktok && (
              <a href="#" className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 hover:bg-gray-900 transition">
                <span className="text-xl">🎵</span>
                TikTok
              </a>
            )}
          </div>
        </div>
        </div>
      </ContentContainer>
    </div>
  )
}

export default DetailView