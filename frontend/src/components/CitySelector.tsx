import React, { useEffect } from 'react'
import { useCityStore, type CityKey } from '../stores/cityStore'

export const CitySelector: React.FC = () => {
  const { 
    selectedCity, 
    setCity, 
    getCity, 
    getAvailableCities, 
    loadAvailableCities, 
    availableCitiesLoaded 
  } = useCityStore()
  const currentCity = getCity()
  const availableCities = getAvailableCities()

  // Load available cities on mount
  useEffect(() => {
    if (!availableCitiesLoaded) {
      loadAvailableCities()
    }
  }, [availableCitiesLoaded, loadAvailableCities])

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCity(event.target.value as CityKey)
  }

  // Show loading state or no cities message
  if (!availableCitiesLoaded) {
    return (
      <div className="relative inline-flex items-center">
        <div className="text-white font-medium text-sm px-2 py-1">
          <span className="sm:hidden">...</span>
          <span className="hidden sm:inline">Loading...</span>
        </div>
      </div>
    )
  }

  if (availableCities.length === 0) {
    return (
      <div className="relative inline-flex items-center">
        <div className="text-white font-medium text-sm px-2 py-1">
          <span className="sm:hidden">N/A</span>
          <span className="hidden sm:inline">No cities</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={selectedCity}
        onChange={handleCityChange}
        className="appearance-none bg-transparent text-transparent font-medium text-sm pr-6 pl-2 py-1
                   focus:outline-hidden focus:ring-2 focus:ring-white focus:ring-offset-1 rounded-lg
                   cursor-pointer hover:bg-green-700 transition w-14 sm:w-auto"
      >
        {availableCities.map((city) => (
          <option key={city.key} value={city.key} className="text-gray-800">
            {city.name}
          </option>
        ))}
      </select>
      {/* Display short code on mobile, full name on desktop */}
      <div className="absolute left-2 pointer-events-none text-white font-medium text-sm">
        <span className="sm:hidden">{currentCity.shortCode}</span>
        <span className="hidden sm:inline">{currentCity.name}</span>
      </div>
      {/* Custom dropdown arrow */}
      <svg
        className="absolute right-2 pointer-events-none text-white"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2.5 4.5L6 8L9.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
