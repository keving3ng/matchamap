import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Edit, Trash2, Share2, Lock, Globe, MapPin, X } from '@/components/icons'
import { PrimaryButton, SecondaryButton, ScoreBadge, AlertDialog } from '../ui'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { CreateListModal } from './CreateListModal'
import type { UserList, UserListItem, UpdateListRequest } from '../../../../shared/types'

export const ListDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [list, setList] = useState<UserList | null>(null)
  const [items, setItems] = useState<UserListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadList()
    }
  }, [id])

  const loadList = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await api.lists.getById(parseInt(id))
      setList(response.list)
      setItems(response.items)
    } catch (err) {
      console.error('Failed to load list:', err)
      setError('Failed to load list')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateList = async (listId: number, data: UpdateListRequest) => {
    try {
      const response = await api.lists.update(listId, data)
      setList(response.list)
      return { success: true, list: response.list }
    } catch (err) {
      console.error('Failed to update list:', err)
      return { success: false, error: 'Failed to update list' }
    }
  }

  const handleDeleteList = async () => {
    if (!list) return

    try {
      setIsDeleting(true)
      await api.lists.delete(list.id)
      navigate('/lists')
    } catch (err) {
      console.error('Failed to delete list:', err)
      setError('Failed to delete list')
      setIsDeleting(false)
    }
  }

  const handleRemoveCafe = async (cafeId: number) => {
    if (!list) return

    try {
      await api.lists.removeItem(list.id, cafeId)
      // Refresh list
      await loadList()
    } catch (err) {
      console.error('Failed to remove cafe:', err)
      setError('Failed to remove cafe from list')
    }
  }

  const handleShare = () => {
    if (!list) return

    const url = `${window.location.origin}/lists/${list.id}`
    if (navigator.share) {
      navigator.share({
        title: list.name,
        text: list.description || `Check out my cafe list: ${list.name}`,
        url,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(url)
      })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  const handleCafeClick = (cafeId: number) => {
    navigate(`/?cafe=${cafeId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'List not found'}</p>
            <SecondaryButton onClick={() => navigate('/lists')}>
              {COPY.lists.backToLists}
            </SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/lists')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft size={20} />
            {COPY.lists.backToLists}
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{list.name}</h1>
                {list.isPublic ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <Globe size={12} />
                    {COPY.lists.publicBadge}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    <Lock size={12} />
                    {COPY.lists.privateBadge}
                  </div>
                )}
              </div>

              {list.description && (
                <p className="text-gray-600 mb-3">{list.description}</p>
              )}

              <p className="text-sm text-gray-500">
                {COPY.lists.listCount(items.length)}
              </p>
            </div>

            <div className="flex gap-2">
              <SecondaryButton
                onClick={handleShare}
                icon={Share2}
                className="hidden sm:flex"
              >
                {COPY.lists.shareList}
              </SecondaryButton>
              <SecondaryButton
                onClick={() => setIsEditModalOpen(true)}
                icon={Edit}
              >
                {COPY.lists.editListButton}
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{COPY.lists.emptyList}</h3>
            <p className="text-gray-600">{COPY.lists.emptyListDescription}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <button
                    onClick={() => handleCafeClick(item.cafe.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{item.cafe.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} />
                          {item.cafe.neighborhood}
                        </div>
                      </div>
                      {item.cafe.overallScore && (
                        <ScoreBadge score={item.cafe.overallScore} size="md" />
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveCafe(item.cafe.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    aria-label={COPY.lists.removeCafe}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <SecondaryButton
            onClick={() => setIsDeleteDialogOpen(true)}
            icon={Trash2}
            className="text-red-600 hover:bg-red-50"
          >
            {COPY.lists.deleteListButton}
          </SecondaryButton>
        </div>
      </div>

      {/* Edit Modal */}
      <CreateListModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onCreate={async () => ({ success: false })} // Not used in edit mode
        onUpdate={handleUpdateList}
        existingList={list}
      />

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <AlertDialog
          variant="error"
          title={COPY.lists.deleteListTitle}
          message={COPY.lists.deleteListMessage(list.name)}
          primaryAction={{
            label: isDeleting ? COPY.lists.deleting : COPY.lists.delete,
            onClick: handleDeleteList,
            disabled: isDeleting,
          }}
          secondaryAction={{
            label: COPY.lists.cancel,
            onClick: () => setIsDeleteDialogOpen(false),
          }}
          onClose={() => setIsDeleteDialogOpen(false)}
        />
      )}
    </div>
  )
}
