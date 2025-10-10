import React from 'react'
import { Calendar, Clock, MapPin, DollarSign, Star } from 'lucide-react'
import { ContentContainer } from './ContentContainer'
import { ListSkeleton } from './ui'
import { useDataStore } from '../stores/dataStore'
import { useLazyData } from '../hooks/useLazyData'
import type { EventsViewProps } from '../types'

export const EventsView: React.FC<EventsViewProps> = ({ eventItems }) => {
  const { fetchEvents, eventsFetched, isLoading } = useDataStore()

  // Lazy load event items when component mounts (only if not already fetched)
  useLazyData(fetchEvents, eventsFetched)
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 font-caveat">Upcoming Events</h2>
        <p className="text-sm text-gray-600 mt-1">Toronto matcha community gatherings & workshops</p>
      </div>

      {/* Event Items */}
      <ContentContainer maxWidth="md">
        <div className="px-4 py-4 space-y-4">
          {isLoading && eventItems.length === 0 ? (
            <ListSkeleton count={3} />
          ) : eventItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-8 text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-lg font-medium">No upcoming events</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon for matcha community gatherings!</p>
            </div>
          ) : (
            eventItems.map((event) => (
            <article
              key={event.id}
              className={`bg-white rounded-2xl shadow-md border-2 ${
                event.featured ? 'border-green-400' : 'border-green-100'
              } overflow-hidden`}
            >
            {event.featured && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold">
                <Star size={16} fill="white" />
                Featured Event
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${
                  event.featured ? 'from-green-500 to-green-700' : 'from-green-400 to-green-600'
                } rounded-xl flex items-center justify-center text-4xl flex-shrink-0 shadow-md`}>
                  {event.image}
                </div>

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

                    <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                      <DollarSign size={14} className="text-green-600" />
                      <span>{event.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mt-3 leading-relaxed">{event.description}</p>
            </div>
          </article>
            ))
          )}
        </div>
      </ContentContainer>
    </div>
  )
}

export default EventsView
