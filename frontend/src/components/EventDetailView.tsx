import React, { useMemo } from 'react'
import { Calendar, Clock, MapPin, DollarSign, Navigation, Instagram, ArrowLeft } from '@/components/icons'
import { useNavigate } from 'react-router'
import { ContentContainer } from './ContentContainer'
import { COPY } from '../constants/copy'
import { useCafeStore } from '../stores/cafeStore'
import { getInstagramUrl } from '../utils/instagram'
import { createSafeGoogleMapsUrl } from '../utils/urlSafety'
import { trackEventClick } from '../utils/analytics'
import type { Event } from '../../../shared/types'

interface EventDetailViewProps {
  event: Event
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ event }) => {
  const navigate = useNavigate()
  const { cafesWithDistance } = useCafeStore()

  // Memoize linked cafe lookup for better performance
  const linkedCafe = useMemo(() => {
    if (event.cafeId) {
      return cafesWithDistance.find(c => c.id === event.cafeId) || null
    }
    return null
  }, [event.cafeId, cafesWithDistance])

  const instagramUrl = getInstagramUrl(event.link)
  const googleMapsUrl = event.location ? createSafeGoogleMapsUrl(event.location) : null

  const handleViewCafe = () => {
    if (linkedCafe) {
      // Navigate to map view with state to select the cafe
      // This avoids race conditions with setTimeout
      navigate('/', { state: { selectedCafeId: linkedCafe.id } })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 pt-0 bg-gradient-to-b from-cream-100 to-white">
      {/* Hero Section */}
      <div className="w-full h-56 bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

        {/* Back button */}
        <button
          onClick={() => navigate('/events')}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all duration-200 z-20"
        >
          <ArrowLeft size={24} className="text-green-600" />
        </button>

        <span className="text-8xl animate-bounce-subtle z-10">🗓️</span>
      </div>

      <ContentContainer maxWidth="md" className="px-4">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-xl -mt-8 p-6 border-2 border-green-200 relative z-10 animate-slide-up">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-charcoal-900 mb-2">{event.title}</h2>
            {event.featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                ⭐ {COPY.events.featuredEvent}
              </span>
            )}
          </div>

          {/* Event Details Grid */}
          <div className="bg-gradient-to-r from-green-50 to-cream-100 -mx-6 px-6 py-4 mb-4 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-gray-700">{COPY.events.date}</div>
                <div className="text-base text-gray-800">{event.date}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-gray-700">{COPY.events.time}</div>
                <div className="text-base text-gray-800">{event.time}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-gray-700">{COPY.events.location}</div>
                <div className="text-base text-gray-800">{event.venue}</div>
                <div className="text-sm text-gray-600">{event.location}</div>
              </div>
            </div>

            {event.price && (
              <div className="flex items-start gap-3">
                <DollarSign size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-gray-700">{COPY.events.price}</div>
                  <div className="text-base text-green-700 font-semibold">{event.price}</div>
                </div>
              </div>
            )}
          </div>

          {/* Instagram CTA if available */}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEventClick(event.id)}
              className="w-full bg-gradient-to-br from-purple-500 via-pink-500 to-pink-600 text-white py-3.5 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
            >
              <Instagram size={20} />
              {COPY.events.viewOnInstagram}
            </a>
          )}

          {/* Get Directions Button */}
          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEventClick(event.id)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
            >
              <Navigation size={20} />
              {COPY.events.getDirections}
            </a>
          ) : (
            <div className="w-full bg-gray-300 text-gray-600 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 mb-3 cursor-not-allowed">
              <Navigation size={20} />
              {COPY.events.getDirections}
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="mt-8 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-md">
              <Calendar size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-charcoal-900">{COPY.events.description}</h3>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>

        {/* Linked Cafe Section */}
        {linkedCafe && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-md">
                <MapPin size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-charcoal-900">{COPY.events.hostedAt}</h3>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-800 mb-1">{linkedCafe.name}</h4>
                    <p className="text-sm text-gray-600">{linkedCafe.address}</p>
                  </div>
                  {linkedCafe.displayScore && (
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-bold text-xl shadow-md">
                      {linkedCafe.displayScore.toFixed(1)}
                    </div>
                  )}
                </div>
                {linkedCafe.quickNote && (
                  <p className="text-sm text-gray-600 italic mb-3">&quot;{linkedCafe.quickNote}&quot;</p>
                )}
                <button
                  onClick={() => {
                    trackEventClick(event.id)
                    handleViewCafe()
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  {COPY.events.viewCafe}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social Features Placeholder (for future) */}
        {/* TODO: Add when social features are implemented
        <div className="mt-8 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-md">
              <Users size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-charcoal-900">Attendees</h3>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-100 text-center">
            <p className="text-gray-500 text-sm">
              {COPY.events.goingCount(42)}
            </p>
          </div>
        </div>
        */}
      </ContentContainer>
    </div>
  )
}

export default EventDetailView
