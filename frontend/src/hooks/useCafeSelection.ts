import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'
import { useCafeStore } from '../stores/cafeStore'
import { getCafeUrlPath } from '../utils/cityMapping'
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

    // Generate slug from cafe name
    const slug = cafe.name.toLowerCase().replace(/\s+/g, '-')
    const urlPath = getCafeUrlPath(cafe.city, slug)

    navigate(urlPath)
    closePopover()
  }

  return {
    selectedCafe: selectedCafeWithLatestInfo,
    handlePinClick,
    viewDetails,
  }
}
