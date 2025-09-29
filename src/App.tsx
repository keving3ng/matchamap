import React, { useState } from 'react'
import { MapPin, List, User, Menu, ArrowLeft } from 'lucide-react'
import MapView from './components/MapView'
import ListView from './components/ListView'
import DetailView from './components/DetailView'
import NewsView from './components/NewsView'
import PassportView from './components/PassportView'
import cafeData from './data/cafes.json'
import type { CafeData, Cafe, ViewType } from './types'

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('map')
  const [showPopover, setShowPopover] = useState<boolean>(false)
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [visitedStamps, setVisitedStamps] = useState<number[]>([2, 4])
  const [visitedLocations, setVisitedLocations] = useState<number[]>([2, 4])

  const { cafes, news } = cafeData as CafeData

  const handlePinClick = (cafe: Cafe): void => {
    setSelectedCafe(cafe)
    setShowPopover(true)
  }

  const viewDetails = (cafe: Cafe): void => {
    setSelectedCafe(cafe)
    setCurrentView('detail')
    setShowPopover(false)
  }

  const toggleStamp = (id: number): void => {
    if (visitedStamps.includes(id)) {
      setVisitedStamps(visitedStamps.filter(stampId => stampId !== id))
    } else {
      setVisitedStamps([...visitedStamps, id])
    }
  }

  const toggleVisited = (id: number): void => {
    if (visitedLocations.includes(id)) {
      setVisitedLocations(visitedLocations.filter(locId => locId !== id))
    } else {
      setVisitedLocations([...visitedLocations, id])
    }
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView === 'detail' && (
              <button 
                onClick={() => setCurrentView('map')}
                className="p-2 hover:bg-green-700 rounded-lg transition"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">🍵</span>
              </div>
              <h1 className="text-xl font-bold tracking-wide">MatchaMap</h1>
            </div>
          </div>
          <button className="p-2 hover:bg-green-700 rounded-lg transition">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'map' && (
        <MapView 
          cafes={cafes}
          showPopover={showPopover}
          selectedCafe={selectedCafe}
          onPinClick={handlePinClick}
          onViewDetails={viewDetails}
          onClosePopover={() => setShowPopover(false)}
        />
      )}
      {currentView === 'detail' && (
        <DetailView 
          cafe={selectedCafe || cafes[0]}
          visitedLocations={visitedLocations}
          onToggleVisited={toggleVisited}
        />
      )}
      {currentView === 'list' && (
        <ListView 
          cafes={cafes}
          expandedCard={expandedCard}
          onToggleExpand={setExpandedCard}
          onViewDetails={viewDetails}
        />
      )}
      {currentView === 'news' && (
        <NewsView newsItems={news} />
      )}
      {currentView === 'passport' && (
        <PassportView 
          cafes={cafes}
          visitedStamps={visitedStamps}
          onToggleStamp={toggleStamp}
        />
      )}

      {/* Bottom Navigation */}
      <div className="bg-white border-t-2 border-green-200 px-6 py-3 shadow-lg">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setCurrentView('map')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'map' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <MapPin size={24} strokeWidth={currentView === 'map' ? 2.5 : 2} />
            <span className={`text-xs ${currentView === 'map' ? 'font-semibold' : ''}`}>Map</span>
          </button>
          <button 
            onClick={() => setCurrentView('list')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'list' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <List size={24} strokeWidth={currentView === 'list' ? 2.5 : 2} />
            <span className={`text-xs ${currentView === 'list' ? 'font-semibold' : ''}`}>List</span>
          </button>
          <button 
            onClick={() => setCurrentView('news')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'news' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <span className="text-2xl">📰</span>
            <span className={`text-xs ${currentView === 'news' ? 'font-semibold' : ''}`}>News</span>
          </button>
          <button 
            onClick={() => setCurrentView('passport')}
            className={`flex flex-col items-center gap-1 transition ${
              currentView === 'passport' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <User size={24} strokeWidth={currentView === 'passport' ? 2.5 : 2} />
            <span className={`text-xs ${currentView === 'passport' ? 'font-semibold' : ''}`}>Passport</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App