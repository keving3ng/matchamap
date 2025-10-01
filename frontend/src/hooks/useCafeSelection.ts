import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'
import { useCafeStore } from '../stores/cafeStore'
import type { CafeWithDistance } from '../types'

/**
 * Hook for managing cafe selection and navigation
 */
export const useCafeSelection = (cafesWithDistance: CafeWithDistance[]) => {
  const navigate = useNavigate()
  const { setShowPopover, closePopover } = useUIStore()
  const { selectedCafe, setSelectedCafe } = useCafeStore()

  // Ensure selectedCafe always has the latest distance info
  const selectedCafeWithLatestInfo = useMemo(() => {
    if (!selectedCafe) return null
    return cafesWithDistance.find(c => c.id === selectedCafe.id) || selectedCafe
  }, [selectedCafe, cafesWithDistance])

  const handlePinClick = (cafe: CafeWithDistance): void => {
    setSelectedCafe(cafe)
    setShowPopover(true)
  }

  const viewDetails = (cafe: CafeWithDistance): void => {
    setSelectedCafe(cafe)
    navigate(`/cafe/${cafe.id}`)
    closePopover()
  }

  return {
    selectedCafe: selectedCafeWithLatestInfo,
    handlePinClick,
    viewDetails,
  }
}
