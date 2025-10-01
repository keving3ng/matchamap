import { useVisitedCafesStore } from '../stores/visitedCafesStore'

export const useVisitedCafes = () => {
  return useVisitedCafesStore()
}