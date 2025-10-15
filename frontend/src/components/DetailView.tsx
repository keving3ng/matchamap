import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Heart, CheckCircle, Instagram, Star, Coffee, MessageSquare, Clock, Calendar as CalendarIcon, Edit3 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { TikTokIcon } from './TikTokIcon'
import { useAppFeatures } from '../hooks/useAppFeatures'
import { getMapsUrl } from '../utils/mapsUrl'
import { ContentContainer } from './ContentContainer'
import { formatHoursCompact } from '../utils/formatHours'
import { sanitizeText } from '../utils/sanitize'
import { COPY } from '../constants/copy'
import { api } from '../utils/api'
import { trackCafeStat, trackCheckIn } from '../utils/analytics'
import { useAuthStore } from '../stores/authStore'
import { ReviewForm } from './reviews/ReviewForm'
import type { DetailViewProps } from '../types'
import type { Event } from '../../../shared/types'

export const DetailView: React.FC<DetailViewProps> = ({ cafe, visitedLocations, onToggleVisited }) => {
  const { isPassportEnabled, isUserAccountsEnabled } = useAppFeatures()
  const { user } = useAuthStore()
  const isVisited: boolean = visitedLocations.includes(cafe.id)
  const mapsUrl = getMapsUrl(cafe.address || '', cafe.link)
  const [cafeEvents, setCafeEvents] = useState<Event[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const navigate = useNavigate()

  const hoursData = cafe.hours ? formatHoursCompact(cafe.hours) : null

  // Track cafe view when component mounts
  useEffect(() => {
    trackCafeStat(cafe.id, 'view')
  }, [cafe.id])

  // Fetch events for this cafe
  useEffect(() => {
    const fetchCafeEvents = async () => {
      try {
        const response = await api.events.getAll({ cafeId: cafe.id, upcoming: true })
        setCafeEvents(response.events)
      } catch (error) {
        console.error('Failed to fetch cafe events:', error)
      }
    }

    fetchCafeEvents()
  }, [cafe.id])

  const handleViewEvent = () => {
    // Navigate to events view
    navigate('/events')
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 pt-0 bg-gradient-to-b from-cream-100 to-white">
      {/* Hero Section */}
      <div className="w-full h-56 bg-gradient-to-br from-matcha-400 via-matcha-500 to-matcha-600 flex items-center justify-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

        <span className="text-8xl animate-bounce-subtle z-10">🍵</span>
        {isUserAccountsEnabled && (
          <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all duration-200 z-20">
            <Heart size={24} className="text-matcha-600" />
          </button>
        )}
      </div>

      <ContentContainer maxWidth="md" className="px-4">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-xl -mt-8 p-6 border-2 border-matcha-200 relative z-10 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-charcoal-900 mb-1">{sanitizeText(cafe.name)}</h2>
              {cafe.city && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-matcha-500 rounded-full"></div>
                  <p className="text-gray-600 font-medium">{sanitizeText(cafe.city)}</p>
                </div>
              )}
            </div>
            {cafe.displayScore && (
              <div className="bg-gradient-to-br from-matcha-500 via-matcha-600 to-matcha-700 text-white px-5 py-3 rounded-2xl font-bold text-2xl shadow-lg animate-scale-in">
                {cafe.displayScore.toFixed(1)}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-matcha-50 to-cream-100 -mx-6 px-6 py-3 mb-4">
            <div className="flex items-start gap-2.5 text-gray-700 mb-3">
              <MapPin size={20} className="text-matcha-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium leading-relaxed">{sanitizeText(cafe.address || '')}</span>
            </div>

            {cafe.distanceInfo && (
              <div className="flex items-center gap-2 text-matcha-700 bg-white/60 px-3 py-2 rounded-lg w-fit">
                <Navigation size={16} className="text-matcha-600" />
                <span className="text-sm font-semibold">{cafe.distanceInfo.formattedKm} away • {cafe.distanceInfo.walkTime} walk</span>
              </div>
            )}
          </div>

          {/* Quick Note in header area */}
          {cafe.quickNote && (
            <div className="bg-gradient-to-r from-cream-50 to-matcha-50 -mx-6 px-6 py-3 mb-4">
              <p className="text-sm text-gray-700 italic">"{cafe.quickNote}"</p>
            </div>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCafeStat(cafe.id, 'directions')}
            className="w-full bg-gradient-to-r from-matcha-600 via-matcha-500 to-matcha-600 text-white py-3.5 rounded-xl font-semibold hover:from-matcha-700 hover:to-matcha-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Navigation size={20} />
            {COPY.detail.getDirections}
          </a>
        </div>

        {/* Visited Checkbox - Only show if passport is enabled */}
        {isPassportEnabled && (
          <div className={`mt-5 rounded-2xl p-5 border-2 transition-all duration-300 ${
            isVisited
              ? 'bg-gradient-to-r from-matcha-50 to-matcha-100 border-matcha-400'
              : 'bg-cream-100 border-matcha-200 hover:border-matcha-300'
          }`}>
            <button
              onClick={() => {
                const wasVisited = isVisited
                onToggleVisited(cafe.id)
                
                // Track differently for authenticated vs anonymous users
                if (!wasVisited) { // Only track when marking as visited (not unvisiting)
                  if (user) {
                    // Authenticated: Track check-in via API
                    trackCheckIn(cafe.id)
                  } else {
                    // Anonymous: Track passport mark
                    trackCafeStat(cafe.id, 'passport')
                  }
                }
              }}
              className="flex items-center gap-3 w-full group"
            >
              <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                isVisited
                  ? 'bg-matcha-600 border-matcha-600 scale-110'
                  : 'border-matcha-400 group-hover:border-matcha-500 group-hover:bg-matcha-50'
              }`}>
                {isVisited && <CheckCircle size={20} className="text-white animate-scale-in" strokeWidth={3} />}
              </div>
              <span className={`font-semibold transition-colors ${
                isVisited ? 'text-matcha-800' : 'text-gray-700 group-hover:text-matcha-700'
              }`}>
                {isVisited ? COPY.detail.visited : COPY.detail.markVisited}
              </span>
            </button>
          </div>
        )}

        {/* Drinks Menu Section */}
        {cafe.drinks && cafe.drinks.length > 0 && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
                <Coffee size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-charcoal-900">{COPY.detail.drinksMenu}</h3>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-matcha-100 overflow-hidden divide-y divide-gray-100">
              {cafe.drinks
                .filter(d => d.isDefault)
                .concat(cafe.drinks.filter(d => !d.isDefault).sort((a, b) => b.score - a.score))
                .map((drink, index) => (
                <div
                  key={drink.id}
                  className={`p-5 transition-colors hover:bg-cream-50 ${
                    drink.isDefault ? 'bg-gradient-to-r from-matcha-50 to-cream-100' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-bold text-gray-800 text-base">{drink.name || 'Iced Matcha Latte'}</h4>
                        {drink.isDefault && (
                          <span className="px-2.5 py-1 bg-gradient-to-r from-matcha-500 to-matcha-600 text-white text-xs font-semibold rounded-full shadow-sm">
                            {COPY.detail.featured}
                          </span>
                        )}
                      </div>
                      
                      {/* Matcha badge moved to left side under title */}
                      {drink.gramsUsed && (
                        <div className="text-xs text-matcha-600 mb-2 bg-matcha-50 px-2 py-1 rounded-md inline-block">
                          {COPY.detail.matchaAmount(drink.gramsUsed)}
                        </div>
                      )}
                      
                      {drink.notes && (
                        <p className="text-sm text-gray-600 italic leading-relaxed">{drink.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-1.5 font-bold text-xl text-matcha-600 mb-1.5">
                        <Star size={18} className="fill-matcha-600" />
                        {drink.score.toFixed(1)}
                      </div>
                      {drink.priceAmount !== null && drink.priceAmount !== undefined && drink.priceCurrency && (
                        <div className="text-sm font-semibold text-gray-700">
                          {drink.priceCurrency === 'CAD' ? '$' : drink.priceCurrency === 'USD' ? '$' : '¥'}
                          {drink.priceAmount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cafe Details Section */}
        <div className="mt-8 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
              <Star size={20} className="text-white fill-white" />
            </div>
            <h3 className="text-xl font-bold text-charcoal-900">{COPY.detail.cafeDetails}</h3>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-matcha-100 space-y-4">
              {cafe.ambianceScore && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cream-50 to-matcha-50 rounded-xl">
                  <span className="text-gray-700 font-medium">{COPY.detail.ambiance}</span>
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-matcha-600 text-lg">{cafe.ambianceScore.toFixed(1)}/10</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cream-50 to-matcha-50 rounded-xl">
                <span className="text-gray-700 font-medium">{COPY.detail.alternativeMilk}</span>
                <span className="font-bold text-gray-800">
                  {cafe.chargeForAltMilk === null || cafe.chargeForAltMilk === undefined
                    ? <span className="text-gray-400 font-normal">{COPY.detail.alternativeMilkUnknown}</span>
                    : cafe.chargeForAltMilk === 0
                    ? <span className="text-matcha-600">{COPY.detail.alternativeMilkFree}</span>
                    : COPY.detail.alternativeMilkCharge(cafe.chargeForAltMilk)}
                </span>
              </div>
            </div>
          </div>

        {/* Review Section */}
        {cafe.review && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
                <MessageSquare size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-charcoal-900">{COPY.detail.ourReview}</h3>
            </div>
            <div className="bg-gradient-to-br from-white to-cream-50 rounded-2xl shadow-lg p-6 border-2 border-matcha-100">
              <div className="flex items-start gap-3">
                <div className="text-4xl">💭</div>
                <p className="text-gray-700 leading-relaxed text-base flex-1 pt-1">{cafe.review}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Reviews Section - Only show Write Review button if user is authenticated */}
        {isUserAccountsEnabled && user && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-charcoal-900">Community Reviews</h3>
              </div>
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-gradient-to-r from-matcha-600 to-matcha-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-matcha-700 hover:to-matcha-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 min-h-[44px]"
              >
                <Edit3 size={18} />
                Write Review
              </button>
            </div>
            {/* TODO: Display existing reviews here */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-matcha-100 text-center text-gray-500">
              No reviews yet. Be the first to review!
            </div>
          </div>
        )}

        {/* Additional Info Sections */}
        {hoursData && hoursData.allHours.length > 0 && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
                <Clock size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-charcoal-900">{COPY.detail.hours}</h3>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-matcha-100">
              {/* Full week hours - always show with current day highlighted */}
              <div className="space-y-2">
                {hoursData.allHours.map((hours, index) => {
                  // Check if this is today's hours by comparing the formatted hours with today's hours
                  const isToday = hoursData.todayHours === hours
                  
                  return (
                    <div 
                      key={index} 
                      className={`text-sm font-medium flex items-center gap-2 p-3 rounded-xl transition-colors ${
                        isToday 
                          ? 'bg-gradient-to-r from-matcha-50 to-cream-100 text-matcha-700 border-2 border-matcha-200' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-matcha-500' : 'bg-gray-400'}`}></div>
                      {hours}
                      {isToday && (
                        <span className="ml-auto text-xs bg-matcha-500 text-white px-2 py-0.5 rounded-full font-semibold">
                          {COPY.detail.today}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}


        {/* Cafe's Instagram */}
        {cafe.instagram && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
                <Instagram size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-charcoal-900">{COPY.detail.follow}</h3>
            </div>
            <a
              href={`https://instagram.com/${cafe.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCafeStat(cafe.id, 'instagram')}
              className="w-full bg-gradient-to-br from-purple-500 via-pink-500 to-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2.5 hover:from-purple-600 hover:to-pink-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Instagram size={22} />
              {cafe.instagram.startsWith('@') ? cafe.instagram : `@${cafe.instagram}`}
            </a>
          </div>
        )}

        {/* Review Links */}
        {(cafe.instagramPostLink || cafe.tiktokPostLink) && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
                <Star size={20} className="text-white fill-white" />
              </div>
              <h3 className="text-xl font-bold text-charcoal-900">{COPY.detail.ourReviews}</h3>
            </div>
            <div className="flex gap-3">
              {cafe.instagramPostLink && (
                <a
                  href={cafe.instagramPostLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCafeStat(cafe.id, 'instagram')}
                  className="flex-1 bg-white border-2 border-purple-300 text-purple-600 py-3.5 px-4 rounded-xl font-semibold hover:bg-purple-50 active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center gap-2 min-h-[44px] shadow-md hover:shadow-lg"
                >
                  <Instagram size={18} />
                  <span>{COPY.detail.seeInstagramReel}</span>
                </a>
              )}
              {cafe.tiktokPostLink && (
                <a
                  href={cafe.tiktokPostLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCafeStat(cafe.id, 'tiktok')}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center gap-2 min-h-[44px] shadow-md hover:shadow-lg"
                >
                  <TikTokIcon size={18} />
                  <span>{COPY.detail.seeTikTokReview}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Events Section */}
        {cafeEvents.length > 0 && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 p-2 rounded-xl shadow-md">
                <CalendarIcon size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-charcoal-900">{COPY.events.title}</h3>
            </div>
            <div className="space-y-3">
              {cafeEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-md border-2 border-matcha-100 p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-start gap-3">
                    {event.featured && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" title="Featured Event" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">{event.title}</h4>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={12} className="text-matcha-600" />
                          {event.date}
                        </span>
                        <span>•</span>
                        <span>{event.time}</span>
                        {event.price && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-matcha-700">{event.price}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleViewEvent}
                    className="w-full mt-3 bg-gradient-to-r from-matcha-500 to-matcha-600 text-white py-2 rounded-lg font-semibold hover:from-matcha-600 hover:to-matcha-700 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    {COPY.events.viewDetails}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </ContentContainer>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <ReviewForm
              cafeId={cafe.id}
              onSuccess={() => {
                setShowReviewForm(false)
                // TODO: Refresh reviews list
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DetailView