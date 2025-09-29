import { useState, useEffect } from 'react'

const VISITED_CAFES_KEY = 'matchamap-visited-cafes'

export const useVisitedCafes = () => {
  const [visitedCafeIds, setVisitedCafeIds] = useState<number[]>([])

  // Load visited cafes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VISITED_CAFES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setVisitedCafeIds(parsed)
        }
      }
    } catch (error) {
      console.warn('Failed to load visited cafes from localStorage:', error)
    }
  }, [])

  // Save to localStorage whenever visited cafes change
  useEffect(() => {
    try {
      localStorage.setItem(VISITED_CAFES_KEY, JSON.stringify(visitedCafeIds))
    } catch (error) {
      console.warn('Failed to save visited cafes to localStorage:', error)
    }
  }, [visitedCafeIds])

  const markAsVisited = (cafeId: number) => {
    setVisitedCafeIds(prev => {
      if (!prev.includes(cafeId)) {
        return [...prev, cafeId]
      }
      return prev
    })
  }

  const markAsUnvisited = (cafeId: number) => {
    setVisitedCafeIds(prev => prev.filter(id => id !== cafeId))
  }

  const toggleVisited = (cafeId: number) => {
    if (visitedCafeIds.includes(cafeId)) {
      markAsUnvisited(cafeId)
    } else {
      markAsVisited(cafeId)
    }
  }

  const isVisited = (cafeId: number) => visitedCafeIds.includes(cafeId)

  const getVisitedCount = () => visitedCafeIds.length

  const clearAllVisited = () => setVisitedCafeIds([])

  return {
    visitedCafeIds,
    markAsVisited,
    markAsUnvisited,
    toggleVisited,
    isVisited,
    getVisitedCount,
    clearAllVisited,
  }
}