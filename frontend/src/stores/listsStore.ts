/**
 * Lists Store - Zustand store for managing custom cafe lists
 * Phase 2E - Custom Lists Feature
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserList, UserListItem, Cafe } from '../../../shared/types'

// Type for list items with populated cafe data
type ListItemWithCafe = UserListItem & { cafe: Cafe }

interface ListsState {
  // State
  lists: UserList[]
  currentList: UserList | null
  currentListItems: ListItemWithCafe[]
  isLoading: boolean
  error: string | null

  // Actions
  setLists: (lists: UserList[]) => void
  setCurrentList: (list: UserList | null) => void
  setCurrentListItems: (items: ListItemWithCafe[]) => void
  addList: (list: UserList) => void
  updateList: (id: number, updates: Partial<UserList>) => void
  removeList: (id: number) => void
  addItemToList: (listId: number, item: ListItemWithCafe) => void
  removeItemFromList: (listId: number, cafeId: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  lists: [],
  currentList: null,
  currentListItems: [],
  isLoading: false,
  error: null,
}

export const useListsStore = create<ListsState>()(
  persist(
    (set) => ({
      ...initialState,

      setLists: (lists) => set({ lists }),

      setCurrentList: (list) => set({ currentList: list }),

      setCurrentListItems: (items) => set({ currentListItems: items }),

      addList: (list) =>
        set((state) => ({
          lists: [list, ...state.lists],
        })),

      updateList: (id, updates) =>
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === id ? { ...list, ...updates } : list
          ),
          currentList:
            state.currentList?.id === id
              ? { ...state.currentList, ...updates }
              : state.currentList,
        })),

      removeList: (id) =>
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== id),
          currentList: state.currentList?.id === id ? null : state.currentList,
          currentListItems: state.currentList?.id === id ? [] : state.currentListItems,
        })),

      addItemToList: (listId, item) =>
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, itemCount: (list.itemCount || 0) + 1 }
              : list
          ),
          currentListItems:
            state.currentList?.id === listId
              ? [item, ...state.currentListItems]
              : state.currentListItems,
        })),

      removeItemFromList: (listId, cafeId) =>
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, itemCount: Math.max(0, (list.itemCount || 0) - 1) }
              : list
          ),
          currentListItems:
            state.currentList?.id === listId
              ? state.currentListItems.filter((item) => item.cafeId !== cafeId)
              : state.currentListItems,
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'matchamap-lists', // localStorage key
      partialize: (state) => ({
        // Only persist lists, not loading/error states
        lists: state.lists,
      }),
    }
  )
)
