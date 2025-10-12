import React from 'react'
import { Calendar, Clock, MapPin, DollarSign, Star, Navigation, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router'
import { ContentContainer } from './ContentContainer'
import { ListSkeleton, ErrorAlert } from './ui'
import { useDataStore } from '../stores/dataStore'
import { useLazyData } from '../hooks/useLazyData'
import { useCafeStore } from '../stores/cafeStore'
import { useCafeSelection } from '../hooks/useCafeSelection'
import { getInstagramUrl } from '../utils/instagram'
import { COPY } from '../constants/copy'
import { api } from '../utils/api'
import type { EventsViewProps } from '../types'
import type { Event } from '../../../shared/types'

export const EventsView: React.FC<EventsViewProps> = ({ eventItems }) => {
  const { fetchEvents, eventsFetched, isLoading } = useDataStore()
  const { cafesWithDistance } = useCafeStore()
  const { handlePinClick } = useCafeSelection(cafesWithDistance)
  const navigate = useNavigate()
  const [showPastEvents, setShowPastEvents] = React.useState(false)
  const [pastEvents, setPastEvents] = React.useState<Event[]>([])
  const [loadingPastEvents, setLoadingPastEvents] = React.useState(false)
  const [pastEventsError, setPastEventsError] = React.useState<string | null>(null)

  // Lazy load event items when component mounts (only if not already fetched)
  useLazyData(fetchEvents, eventsFetched)

  // Sort events: featured first, then by date
  const sortedEvents = React.useMemo(() => {
    return [...eventItems].sort((a, b) => {
      // Featured events first
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      // Then sort by date
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  }, [eventItems])

  // Helper function to navigate to cafe on map
  const handleViewCafe = (cafeId: number) => {
    // Navigate to map view with state to select the cafe
    // This avoids race conditions with setTimeout
    navigate('/', { state: { selectedCafeId: cafeId } })
  }

  const handleViewEventDetails = (event: Event) => {
    navigate(`/events/${event.id}`)
  }

  const handleTogglePastEvents = async () => {
    if (!showPastEvents) {
      // Fetch past events
      setLoadingPastEvents(true)
      setPastEventsError(null)
      try {
        const response = await api.events.getAll({ upcoming: false })
        setPastEvents(response.events)
      } catch (error) {
        console.error('Failed to fetch past events:', error)
        setPastEventsError(COPY.events.failedToLoadPastEvents)
      } finally {
        setLoadingPastEvents(false)
      }
    }
    setShowPastEvents(!showPastEvents)
  }

  // Backend already sorts past events by most recent first, no need to sort again

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 font-caveat">{COPY.events.title}</h2>
        <p className="text-sm text-gray-600 mt-1">{COPY.events.subtitle}</p>
      </div>

      {/* Event Items */}
      <ContentContainer maxWidth="md">
        <div className="px-4 py-4 space-y-4">
          {isLoading && sortedEvents.length === 0 ? (
            <ListSkeleton count={3} />
          ) : sortedEvents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-8 text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-lg font-medium">No upcoming events</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon for matcha community gatherings!</p>
            </div>
          ) : (
            sortedEvents.map((event) => (
            <article
              key={event.id}
              className={`bg-white rounded-2xl shadow-md border-2 ${
                event.featured ? 'border-green-400' : 'border-green-100'
              } overflow-hidden`}
            >
            {event.featured && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
                <Star size={16} fill="white" />
                {COPY.events.featuredEvent}
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Instagram link icon or emoji */}
                {event.link && getInstagramUrl(event.link) && (
                  <a
                    href={getInstagramUrl(event.link)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-16 h-16 bg-gradient-to-br ${
                      event.featured ? 'from-green-500 to-green-700' : 'from-green-400 to-green-600'
                    } rounded-xl flex items-center justify-center text-4xl flex-shrink-0 shadow-md hover:scale-105 transition-transform`}
                    title={COPY.events.viewOnInstagram}
                  >
                    🍵
                  </a>
                )}

                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight">{event.title}</h3>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Calendar size={14} className="text-green-600" />
                      <span>{event.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Clock size={14} className="text-green-600" />
                      <span>{event.time}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <MapPin size={14} className="text-green-600" />
                      <span>{event.venue}, {event.location}</span>
                    </div>

                    {/* Only show price if it exists */}
                    {event.price && (
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                        <DollarSign size={14} className="text-green-600" />
                        <span>{event.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">{event.description}</p>

              {/* Action buttons */}
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => handleViewEventDetails(event)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  {COPY.events.viewDetails}
                </button>

                {/* Cafe link button */}
                {event.cafeId && (
                  <button
                    onClick={() => handleViewCafe(event.cafeId!)}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-green-500 text-green-700 py-2.5 rounded-xl font-semibold hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
                  >
                    <Navigation size={16} />
                    {COPY.events.viewCafe}
                  </button>
                )}
              </div>
            </div>
          </article>
            ))
          )}

          {/* Past Events Toggle Button */}
          {sortedEvents.length > 0 && (
            <div className="mt-6">
              <button
                onClick={handleTogglePastEvents}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                {showPastEvents ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showPastEvents ? COPY.events.hidePastEvents : COPY.events.showPastEvents}
              </button>
            </div>
          )}

          {/* Past Events Section */}
          {showPastEvents && (
            <div className="mt-6">
              {pastEventsError ? (
                <ErrorAlert 
                  message={pastEventsError} 
                  onDismiss={() => setPastEventsError(null)}
                  className="mb-4"
                />
              ) : loadingPastEvents ? (
                <ListSkeleton count={3} />
              ) : pastEvents.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-8 text-center">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-lg font-medium">No past events</p>
                  <p className="text-gray-400 text-sm mt-2">Past events will appear here</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 px-2">
                    <h3 className="text-lg font-bold text-gray-600">Past Events</h3>
                    <p className="text-sm text-gray-500">{pastEvents.length} event{pastEvents.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="space-y-4 opacity-75">
                    {pastEvents.map((event) => (
                      <article
                        key={event.id}
                        className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Instagram link icon or emoji */}
                            {event.link && getInstagramUrl(event.link) && (
                              <a
                                href={getInstagramUrl(event.link)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 shadow-md hover:scale-105 transition-transform"
                                title={COPY.events.viewOnInstagram}
                              >
                                🍵
                              </a>
                            )}

                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-700 mb-2 leading-tight">{event.title}</h3>

                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Calendar size={14} className="text-gray-500" />
                                  <span>{event.date}</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Clock size={14} className="text-gray-500" />
                                  <span>{event.time}</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <MapPin size={14} className="text-gray-500" />
                                  <span>{event.venue}, {event.location}</span>
                                </div>

                                {event.price && (
                                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                                    <DollarSign size={14} className="text-gray-500" />
                                    <span>{event.price}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap line-clamp-2">{event.description}</p>

                          {/* Action button */}
                          <div className="mt-3">
                            <button
                              onClick={() => handleViewEventDetails(event)}
                              className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-all shadow-md"
                            >
                              {COPY.events.viewDetails}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ContentContainer>
    </div>
  )
}

export default EventsView
