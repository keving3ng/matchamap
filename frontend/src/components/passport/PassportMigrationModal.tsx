import React from 'react'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton } from '../ui'

interface PassportMigrationModalProps {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  localVisitCount: number
  onMigrate: () => void
  onSkip: () => void
  onClose: () => void
}

export const PassportMigrationModal: React.FC<PassportMigrationModalProps> = ({
  isOpen,
  isLoading,
  error,
  localVisitCount,
  onMigrate,
  onSkip,
  onClose,
}) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-3xl shadow-md mx-auto mb-4">
            🎫
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {COPY.passport.migrationModal.title}
          </h2>
          <p className="text-gray-600 text-sm">
            {COPY.passport.migrationModal.description}
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm">📍</span>
            </div>
            <div>
              <p className="font-semibold text-green-800">
                {COPY.passport.migrationModal.localVisits(localVisitCount)}
              </p>
              <p className="text-sm text-green-600">
                These will be synced to your account
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-600 text-sm font-medium">
              {COPY.passport.migrationModal.error}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <SecondaryButton
            onClick={onSkip}
            disabled={isLoading}
            className="flex-1"
          >
            {COPY.passport.migrationModal.skip}
          </SecondaryButton>
          <PrimaryButton
            onClick={onMigrate}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading 
              ? COPY.passport.migrationModal.migrating 
              : COPY.passport.migrationModal.migrate
            }
          </PrimaryButton>
        </div>

        {/* Close button for desktop */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  )
}