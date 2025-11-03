import React, { useState, useEffect } from 'react'
import { MapPin, Check, X, User } from '@/components/icons'
import { api } from '../../utils/api'
import { COPY } from '../../constants/copy'
import { PrimaryButton, SecondaryButton } from '../ui/Button'
import { StatusBadge } from '../ui/Badge'
import type { CafeSuggestion } from '../../../../shared/types'

export const CafeSuggestionsPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<CafeSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<CafeSuggestion | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [cafeId, setCafeId] = useState<string>('')

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    try {
      setLoading(true)
      const response = await api.suggestions.getPendingSuggestions()
      setSuggestions(response.suggestions)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (suggestion: CafeSuggestion) => {
    if (!confirm(`Approve suggestion "${suggestion.name}"?`)) {
      return
    }

    setProcessingId(suggestion.id)
    try {
      await api.suggestions.approve(suggestion.id, {
        adminNotes: adminNotes || undefined,
        cafeId: cafeId ? parseInt(cafeId, 10) : undefined,
      })
      await loadSuggestions()
      setSelectedSuggestion(null)
      setAdminNotes('')
      setCafeId('')
    } catch (error) {
      console.error('Failed to approve suggestion:', error)
      alert('Failed to approve suggestion: ' + (error as Error).message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (suggestion: CafeSuggestion) => {
    if (!confirm(`Reject suggestion "${suggestion.name}"?`)) {
      return
    }

    setProcessingId(suggestion.id)
    try {
      await api.suggestions.reject(suggestion.id, {
        adminNotes: adminNotes || undefined,
      })
      await loadSuggestions()
      setSelectedSuggestion(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Failed to reject suggestion:', error)
      alert('Failed to reject suggestion: ' + (error as Error).message)
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {COPY.suggestions.adminTitle}
        </h1>
        <p className="text-gray-600">{COPY.suggestions.adminDescription}</p>
      </div>

      {/* Suggestions List */}
      {suggestions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">{COPY.suggestions.adminEmpty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{suggestion.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>
                      {COPY.suggestions.suggestedBy(
                        suggestion.user?.username || 'Unknown'
                      )}
                    </span>
                    <span>•</span>
                    <span>{formatDate(suggestion.createdAt)}</span>
                  </div>
                </div>
                <StatusBadge status="pending" />
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 text-sm">
                <div>
                  <span className="font-medium">Address:</span> {suggestion.address}
                </div>
                <div>
                  <span className="font-medium">City:</span>{' '}
                  {suggestion.city.charAt(0).toUpperCase() + suggestion.city.slice(1)}
                </div>
                {suggestion.neighborhood && (
                  <div>
                    <span className="font-medium">Neighborhood:</span>{' '}
                    {suggestion.neighborhood}
                  </div>
                )}
                {suggestion.description && (
                  <div>
                    <span className="font-medium">Description:</span>{' '}
                    {suggestion.description}
                  </div>
                )}
                {suggestion.googleMapsUrl && (
                  <div>
                    <span className="font-medium">Google Maps:</span>{' '}
                    <a
                      href={suggestion.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      View on Maps
                    </a>
                  </div>
                )}
                {suggestion.instagram && (
                  <div>
                    <span className="font-medium">Instagram:</span> {suggestion.instagram}
                  </div>
                )}
                {suggestion.website && (
                  <div>
                    <span className="font-medium">Website:</span>{' '}
                    <a
                      href={suggestion.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      Visit
                    </a>
                  </div>
                )}
              </div>

              {/* Moderation Section */}
              {selectedSuggestion?.id === suggestion.id ? (
                <div className="space-y-3 pt-3 border-t">
                  <div>
                    <label htmlFor="adminNotes" className="block text-sm font-medium mb-1">
                      {COPY.suggestions.adminNotesLabel}
                    </label>
                    <textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={COPY.suggestions.adminNotesPlaceholder}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="cafeId" className="block text-sm font-medium mb-1">
                      {COPY.suggestions.cafeIdLabel}
                    </label>
                    <input
                      type="number"
                      id="cafeId"
                      value={cafeId}
                      onChange={(e) => setCafeId(e.target.value)}
                      placeholder={COPY.suggestions.cafeIdPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <PrimaryButton
                      onClick={() => handleApprove(suggestion)}
                      disabled={processingId === suggestion.id}
                      icon={Check}
                      className="flex-1"
                    >
                      {processingId === suggestion.id
                        ? COPY.suggestions.approving
                        : COPY.suggestions.approveButton}
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={() => handleReject(suggestion)}
                      disabled={processingId === suggestion.id}
                      icon={X}
                      className="flex-1"
                    >
                      {processingId === suggestion.id
                        ? COPY.suggestions.rejecting
                        : COPY.suggestions.rejectButton}
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={() => {
                        setSelectedSuggestion(null)
                        setAdminNotes('')
                        setCafeId('')
                      }}
                      disabled={processingId === suggestion.id}
                    >
                      Cancel
                    </SecondaryButton>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-3 border-t">
                  <PrimaryButton
                    onClick={() => setSelectedSuggestion(suggestion)}
                    icon={Check}
                    className="flex-1"
                  >
                    {COPY.suggestions.approveButton}
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => setSelectedSuggestion(suggestion)}
                    icon={X}
                    className="flex-1"
                  >
                    {COPY.suggestions.rejectButton}
                  </SecondaryButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
