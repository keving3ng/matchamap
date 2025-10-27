import React, { useState } from 'react'
import { CheckCircle, Plus } from '@/components/icons'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton } from '../ui'
import { CheckInModal } from './CheckInModal'
import { useUserFeatures } from '../../hooks/useUserFeatures'
import type { Cafe } from '../../../../shared/types'

interface CheckInButtonProps {
  cafe: Cafe
  isCheckedIn?: boolean
  onCheckInSuccess?: () => void
  className?: string
}

/**
 * CheckInButton - Button component for checking in to a cafe
 * 
 * Features:
 * - Shows different states: check-in vs checked-in
 * - Opens CheckInModal for enhanced check-in flow
 * - Only visible to authenticated users with social features enabled
 * - Mobile-optimized with proper touch targets
 */
export const CheckInButton: React.FC<CheckInButtonProps> = ({
  cafe,
  isCheckedIn = false,
  onCheckInSuccess,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isUserCheckinsEnabled } = useUserFeatures()

  // Don't render if user social features are disabled
  if (!isUserCheckinsEnabled) {
    return null
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleCheckInSuccess = () => {
    setIsModalOpen(false)
    onCheckInSuccess?.()
  }

  if (isCheckedIn) {
    return (
      <SecondaryButton
        icon={CheckCircle}
        onClick={handleOpenModal}
        className={`${className}`}
        disabled
      >
        {COPY.checkin.checkedIn}
      </SecondaryButton>
    )
  }

  return (
    <>
      <PrimaryButton
        icon={Plus}
        onClick={handleOpenModal}
        className={`${className}`}
      >
        {COPY.checkin.checkIn}
      </PrimaryButton>

      <CheckInModal
        cafe={cafe}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCheckInSuccess}
      />
    </>
  )
}