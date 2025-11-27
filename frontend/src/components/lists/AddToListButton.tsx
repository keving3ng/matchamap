import React, { useState, useEffect } from 'react'
import { Plus, Check } from '@/components/icons'
import { SecondaryButton } from '../ui'
import { COPY } from '../../constants/copy'
import { api } from '../../utils/api'
import { CreateListModal } from './CreateListModal'
import type { UserList, CreateListRequest, AddListItemRequest } from '../../../../shared/types'

interface AddToListButtonProps {
  cafeId: number
  cafeName: string
  variant?: 'button' | 'icon'
}

export const AddToListButton: React.FC<AddToListButtonProps> = ({
  cafeId,
  cafeName,
  variant = 'button',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [lists, setLists] = useState<(UserList & { itemCount: number })[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addedListId, setAddedListId] = useState<number | null>(null)

  useEffect(() => {
    if (isDropdownOpen) {
      loadLists()
    }
  }, [isDropdownOpen])

  const loadLists = async () => {
    try {
      setIsLoadingLists(true)
      const response = await api.lists.getMyLists()
      setLists(response.lists)
    } catch (err) {
      console.error('Failed to load lists:', err)
    } finally {
      setIsLoadingLists(false)
    }
  }

  const handleCreateList = async (data: CreateListRequest) => {
    try {
      const response = await api.lists.create(data)
      await loadLists() // Refresh the list
      setSelectedListId(response.list.id)
      return { success: true, list: response.list }
    } catch (err) {
      console.error('Failed to create list:', err)
      return { success: false, error: 'Failed to create list' }
    }
  }

  const handleAddToList = async () => {
    if (!selectedListId) return

    try {
      setIsAdding(true)
      const data: AddListItemRequest = {
        cafeId,
        notes: notes.trim() || undefined,
      }
      await api.lists.addItem(selectedListId, data)
      setAddedListId(selectedListId)

      // Reset after 2 seconds
      setTimeout(() => {
        setIsDropdownOpen(false)
        setSelectedListId(null)
        setNotes('')
        setAddedListId(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to add to list:', err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleListSelect = (listId: number) => {
    if (selectedListId === listId) {
      setSelectedListId(null)
    } else {
      setSelectedListId(listId)
    }
  }

  return (
    <div className="relative">
      {variant === 'icon' ? (
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={COPY.lists.addToList}
        >
          <Plus size={20} />
        </button>
      ) : (
        <SecondaryButton
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          icon={Plus}
        >
          {COPY.lists.addToList}
        </SecondaryButton>
      )}

      {/* Dropdown */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{COPY.lists.addToList}</h3>
              <p className="text-sm text-gray-600 mt-1">{cafeName}</p>
            </div>

            {isLoadingLists ? (
              <div className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Lists */}
                <div className="flex-1 overflow-y-auto p-2">
                  {lists.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {COPY.lists.noLists}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {lists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => handleListSelect(list.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                            selectedListId === list.id
                              ? 'bg-matcha-50 border border-matcha-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{list.name}</div>
                            <div className="text-xs text-gray-500">
                              {COPY.lists.listCount(list.itemCount)}
                            </div>
                          </div>
                          {selectedListId === list.id && (
                            <Check size={20} className="text-matcha-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Create New List Button */}
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(true)
                      setIsDropdownOpen(false)
                    }}
                    className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 text-matcha-600 font-medium mt-2"
                  >
                    <Plus size={20} />
                    {COPY.lists.createNewListOption}
                  </button>
                </div>

                {/* Notes and Add Button */}
                {selectedListId && (
                  <div className="p-4 border-t border-gray-200">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={COPY.lists.notesPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none mb-3"
                      rows={2}
                      maxLength={500}
                    />
                    <button
                      onClick={handleAddToList}
                      disabled={isAdding || !!addedListId}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                        addedListId
                          ? 'bg-green-600 text-white'
                          : 'bg-matcha-600 text-white hover:bg-matcha-700 active:scale-[0.98]'
                      } disabled:opacity-50`}
                    >
                      {addedListId ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check size={20} />
                          {COPY.lists.addedToList}
                        </span>
                      ) : (
                        isAdding ? COPY.lists.addingToList : COPY.lists.add
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setIsDropdownOpen(true)
        }}
        onCreate={handleCreateList}
      />
    </div>
  )
}
