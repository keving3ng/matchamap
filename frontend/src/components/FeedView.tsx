import React from 'react'
import { MapPinned, Star, Calendar } from 'lucide-react'
import { ContentContainer } from './ContentContainer'
import { useDataStore } from '../stores/dataStore'
import { useLazyData } from '../hooks/useLazyData'
import type { FeedViewProps } from '../types'

export const FeedView: React.FC<FeedViewProps> = ({ feedItems }) => {
  const { fetchFeed, feedFetched } = useDataStore()

  // Lazy load feed items when component mounts (only if not already fetched)
  useLazyData(fetchFeed, feedFetched)
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-green-200 px-4 py-4 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 font-caveat">What's New</h2>
        <p className="text-sm text-gray-600 mt-1">Latest updates from the Toronto matcha scene</p>
      </div>

      {/* Feed Items */}
      <ContentContainer maxWidth="md">
        <div className="px-4 py-4 space-y-4">
          {feedItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md border-2 border-green-100 p-8 text-center">
              <Star size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-lg font-medium">No news items yet</p>
              <p className="text-gray-400 text-sm mt-2">Stay tuned for updates from the matcha scene!</p>
            </div>
          ) : (
            feedItems.map((item) => (
            <article key={item.id} className="bg-white rounded-2xl shadow-md border-2 border-green-100 overflow-hidden">
            <div className={`${
              item.type === 'new_location' ? 'bg-green-500' :
              item.type === 'score_update' ? 'bg-blue-500' :
              'bg-purple-500'
            } text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold`}>
              {item.type === 'new_location' ? <MapPinned size={16} /> : <Star size={16} />}
              {item.type === 'new_location' ? 'New Location' :
               item.type === 'score_update' ? 'Updated Review' : 'Announcement'}
            </div>

            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 shadow-md">
                  {item.image}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <Calendar size={12} />
                    <span>{item.date}</span>
                  </div>
                  {item.score && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-green-500 text-white px-2.5 py-1 rounded-full font-bold text-sm">
                        {item.score}
                      </div>
                      {item.previousScore && (
                        <div className="text-xs text-gray-500">
                          (was {item.previousScore})
                        </div>
                      )}
                      {item.neighborhood && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{item.neighborhood}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-700 mt-3 leading-relaxed">{item.preview}</p>
            </div>
          </article>
            ))
          )}
        </div>
      </ContentContainer>
    </div>
  )
}

export default FeedView