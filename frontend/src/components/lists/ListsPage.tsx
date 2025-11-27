import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Lock, Globe } from '@/components/icons'
import { PrimaryButton } from '../ui'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { CreateListModal } from './CreateListModal'
import type { UserList, CreateListRequest } from '../../../../shared/types'

export const ListsPage: React.FC = () => {
  const navigate = useNavigate()
  const [lists, setLists] = useState<(UserList & { itemCount: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.lists.getMyLists()
      setLists(response.lists)
    } catch (err) {
      console.error('Failed to load lists:', err)
      setError('Failed to load lists')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = async (data: CreateListRequest) => {
    try {
      const response = await api.lists.create(data)
      await loadLists() // Refresh the list
      return { success: true, list: response.list }
    } catch (err) {
      console.error('Failed to create list:', err)
      return { success: false, error: 'Failed to create list' }
    }
  }

  const handleListClick = (listId: number) => {
    navigate(`/lists/${listId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{COPY.lists.myLists}</h1>
              {lists.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {lists.length} {lists.length === 1 ? 'list' : 'lists'}
                </p>
              )}
            </div>
            <PrimaryButton
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
            >
              {COPY.lists.createList}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {lists.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-matcha-100 rounded-full flex items-center justify-center">
                <Plus className="text-matcha-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{COPY.lists.noLists}</h3>
              <p className="text-gray-600 mb-6">{COPY.lists.noListsDescription}</p>
              <PrimaryButton
                onClick={() => setIsCreateModalOpen(true)}
                icon={Plus}
              >
                {COPY.lists.createList}
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleListClick(list.id)}
                className="bg-white rounded-2xl p-6 text-left hover:shadow-md transition-shadow border border-gray-200 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{list.name}</h3>
                  <div className="flex-shrink-0 ml-2">
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
                </div>

                {list.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{list.description}</p>
                )}

                <div className="text-sm text-gray-500">
                  {COPY.lists.listCount(list.itemCount)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateList}
      />
    </div>
  )
}
