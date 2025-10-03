import React, { useState } from 'react'
import { MapPin, Navigation, Heart, CheckCircle, Instagram, ChevronDown, ChevronUp, Star, Coffee } from 'lucide-react'
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
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{cafe.name}</h2>
              {cafe.city && (
                <p className="text-gray-600 mt-1">{cafe.city}</p>
              )}
            </div>
            {(cafe.displayScore || cafe.score) && (
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-bold text-2xl shadow-md">
                {(cafe.displayScore || cafe.score)!.toFixed(1)}
              </div>
            )}
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

        {/* Drinks Menu Section */}
        {cafe.drinks && cafe.drinks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Coffee size={20} className="text-green-600" />
              Drinks Menu
            </h3>
            <div className="bg-white rounded-xl shadow border border-green-100 divide-y divide-gray-100">
              {cafe.drinks
                .filter(d => d.isDefault)
                .concat(cafe.drinks.filter(d => !d.isDefault).sort((a, b) => b.score - a.score))
                .map((drink) => (
                <div key={drink.id} className={`p-4 ${drink.isDefault ? 'bg-green-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{drink.name}</h4>
                        {drink.isDefault && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      {drink.notes && (
                        <p className="text-sm text-gray-600 italic">{drink.notes}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-1 font-bold text-lg text-green-600 mb-1">
                        <Star size={16} className="fill-green-600" />
                        {drink.score.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {drink.priceCurrency === 'CAD' ? '$' : drink.priceCurrency === 'USD' ? '$' : '¥'}
                        {drink.priceAmount.toFixed(2)}
                      </div>
                      {drink.gramsUsed && (
                        <div className="text-xs text-gray-500 mt-1">{drink.gramsUsed}g matcha</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cafe Details Section */}
        {(cafe.ambianceScore || cafe.chargeForAltMilk !== undefined) && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Cafe Details</h3>
            <div className="bg-white rounded-xl shadow p-4 border border-green-100 space-y-3">
              {cafe.ambianceScore && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Ambiance</span>
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-green-600">{cafe.ambianceScore.toFixed(1)}/10</span>
                  </div>
                </div>
              )}
              {cafe.chargeForAltMilk !== null && cafe.chargeForAltMilk !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Alternative Milk</span>
                  <span className="font-semibold text-gray-800">
                    {cafe.chargeForAltMilk > 0 ? `+$${cafe.chargeForAltMilk.toFixed(2)}` : 'Free'}
                  </span>
                </div>
              )}
            </div>
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

        {cafe.quickNote && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Quick Note</h3>
            <div className="bg-green-50 rounded-xl shadow p-4 border border-green-200">
              <p className="text-gray-700 italic">"{cafe.quickNote}"</p>
            </div>
          </div>
        )}

        {/* Social Media */}
        {(cafe.instagram || cafe.instagramPostLink || cafe.tiktokPostLink) && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Social Media</h3>
            <div className="flex gap-3">
              {cafe.instagram && (
                <a
                  href={`https://instagram.com/${cafe.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-br from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition"
                >
                  <Instagram size={20} />
                  Instagram
                </a>
              )}
              {cafe.tiktokPostLink && (
                <a
                  href={cafe.tiktokPostLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 hover:bg-gray-900 transition"
                >
                  <span className="text-xl">🎵</span>
                  TikTok
                </a>
              )}
            </div>
          </div>
        )}
        </div>
      </ContentContainer>
    </div>
  )
}

export default DetailView