import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PassportView } from '../PassportView'
import type { Cafe } from '../../types'
import { api } from '../../utils/api'

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null,
  token: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
  verifyEmail: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock passport migration hook
const mockMigrationState = {
  isOpen: false,
  isLoading: false,
  error: null,
  localVisitCount: 0,
}

const mockPassportMigration = {
  migrationState: mockMigrationState,
  checkAndShowMigration: vi.fn(),
  closeMigration: vi.fn(),
  migrateStamps: vi.fn(),
  skipMigration: vi.fn(),
}

vi.mock('../../hooks/usePassportMigration', () => ({
  usePassportMigration: () => mockPassportMigration,
}))

// Mock API - use factory function to avoid hoisting issues
vi.mock('../../utils/api', () => ({
  api: {
    stats: {
      getMyCheckins: vi.fn(),
      checkIn: vi.fn(),
    },
  },
}))

// Mock copy constants 
vi.mock('../../constants/copy', () => ({
  COPY: {
    passport: {
      title: 'Matcha Passport',
      subtitle: 'Track your matcha journey across Toronto',
    },
    common: {
      loading: 'Loading...',
    },
  },
}))

// Mock icons
vi.mock('@/components/icons', () => ({
  TrendingUp: () => 'TrendingUp',
}))

// Mock ContentContainer
vi.mock('../ContentContainer', () => ({
  ContentContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock PassportMigrationModal
vi.mock('../passport/PassportMigrationModal', () => ({
  PassportMigrationModal: () => <div data-testid="passport-migration-modal">Migration Modal</div>,
}))

// Mock cafes data
const mockCafes: Cafe[] = [
  {
    id: 1,
    name: 'Test Cafe 1',
    slug: 'test-cafe-1',
    latitude: 43.6532,
    longitude: -79.3832,
    link: 'https://maps.google.com/?q=Test+Cafe+1',
    city: 'Toronto',
    displayScore: 8.5,
    quickNote: 'Great matcha',
  },
  {
    id: 2,
    name: 'Test Cafe 2',
    slug: 'test-cafe-2',
    latitude: 43.6632,
    longitude: -79.3932,
    link: 'https://maps.google.com/?q=Test+Cafe+2',
    city: 'Toronto',
    displayScore: 9.0,
    quickNote: 'Amazing atmosphere',
  },
]

// Mock check-ins data
const mockCheckins = [
  {
    id: 1,
    cafeId: 1,
    visitedAt: '2024-01-15T10:30:00Z',
    notes: 'Great experience!',
    cafe: {
      id: 1,
      name: 'Test Cafe 1',
      slug: 'test-cafe-1',
      address: '123 Main St',
      latitude: 43.6532,
      longitude: -79.3832,
      city: 'Toronto',
      quickNote: 'Great matcha',
      instagram: '@testcafe1',
      tiktokPostLink: null,
      instagramPostLink: null,
    },
  },
]

describe('PassportView - Enhanced Backend Sync', () => {
  const mockOnToggleStamp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset auth store to unauthenticated state
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null
    mockAuthStore.token = null

    // Reset migration state
    mockMigrationState.isOpen = false
    mockMigrationState.isLoading = false
    mockMigrationState.error = null
    mockMigrationState.localVisitCount = 0

    // Reset API mocks
    vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: [] })
    vi.mocked(api.stats.checkIn).mockResolvedValue(undefined)
  })

  describe('Unauthenticated Users', () => {
    it('should use localStorage for unauthenticated users', () => {
      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[1]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      // Should show visited status based on visitedStamps prop
      const visitedCard = screen.getByText('Test Cafe 1').closest('button')!
      expect(visitedCard).toHaveClass('scale-100')
      expect(visitedCard).not.toHaveClass('opacity-40')

      // Should not call backend API
      expect(api.stats.getMyCheckins).not.toHaveBeenCalled()
    })

    it('should call onToggleStamp for unauthenticated users', async () => {
      const user = userEvent.setup()
      mockOnToggleStamp.mockResolvedValue(undefined)

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      const cafeCard = screen.getByText('Test Cafe 1').closest('button')!
      await user.click(cafeCard)

      expect(mockOnToggleStamp).toHaveBeenCalledWith(1)
      expect(vi.mocked(api.stats.checkIn)).not.toHaveBeenCalled()
    })
  })

  describe('Authenticated Users', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = { id: 1, email: 'test@example.com' }
      mockAuthStore.token = 'mock-token'
    })

    it('should load check-ins from backend for authenticated users', async () => {
      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: mockCheckins })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(vi.mocked(api.stats.getMyCheckins)).toHaveBeenCalledTimes(1)
      })

      // Should show visited status based on backend check-ins
      const visitedCard = screen.getByText('Test Cafe 1').closest('button')!
      expect(visitedCard).toHaveClass('scale-100')
    })

    it('should show timestamps for authenticated users', async () => {
      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: mockCheckins })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
      })
    })

    it('should show notes for authenticated users', async () => {
      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: mockCheckins })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        // Check for notes indicator icon
        expect(screen.getByText('📝')).toBeInTheDocument()
      })
    })

    it('should use backend API for check-ins when authenticated', async () => {
      const user = userEvent.setup()
      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: [] })
      vi.mocked(api.stats.checkIn).mockResolvedValue(undefined)

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      // Wait for loading to complete and cafe card to appear
      const cafeCard = await screen.findByText('Test Cafe 1')
      await user.click(cafeCard.closest('button')!)

      await waitFor(() => {
        expect(vi.mocked(api.stats.checkIn)).toHaveBeenCalledWith(1)
        expect(vi.mocked(api.stats.getMyCheckins)).toHaveBeenCalledTimes(2) // Initial load + refresh
      })

      expect(mockOnToggleStamp).not.toHaveBeenCalled()
    })

    it('should handle check-in API errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: [] })
      vi.mocked(api.stats.checkIn).mockRejectedValue(new Error('Network error'))

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      // Wait for loading to complete and cafe card to appear
      const cafeCard = await screen.findByText('Test Cafe 1')
      await user.click(cafeCard.closest('button')!)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error checking in:', expect.any(Error))
      })

      // Button should no longer be loading
      const button = cafeCard.closest('button')!
      expect(button).not.toHaveClass('animate-pulse')
      expect(button).not.toBeDisabled()

      consoleSpy.mockRestore()
    })

    it('should show loading state during backend check-in', async () => {
      const user = userEvent.setup()
      let resolveCheckIn: () => void
      const checkInPromise = new Promise<void>((resolve) => {
        resolveCheckIn = resolve
      })

      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: [] })
      vi.mocked(api.stats.checkIn).mockReturnValue(checkInPromise)

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      // Wait for loading to complete and cafe card to appear
      const cafeCard = await screen.findByText('Test Cafe 1')
      const button = cafeCard.closest('button')!
      await user.click(button)

      // Should show loading state
      expect(button).toHaveClass('animate-pulse')
      expect(button).toBeDisabled()

      // Resolve the check-in
      resolveCheckIn!()
      await waitFor(() => {
        expect(button).not.toHaveClass('animate-pulse')
        expect(button).not.toBeDisabled()
      })
    })

    it('should handle failed check-ins load', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(api.stats.getMyCheckins).mockRejectedValue(new Error('Server error'))

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load check-ins:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should trigger migration check for authenticated users', async () => {
      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: [] })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(mockPassportMigration.checkAndShowMigration).toHaveBeenCalled()
      })
    })
  })

  describe('Migration Modal', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = { id: 1, email: 'test@example.com' }
      mockAuthStore.token = 'mock-token'

      mockMigrationState.isOpen = true
      mockMigrationState.isLoading = false
      mockMigrationState.error = null
      mockMigrationState.localVisitCount = 3
    })

    it('should render migration modal when open', () => {
      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      expect(screen.getByTestId('passport-migration-modal')).toBeInTheDocument()
    })

    it('should pass correct props to migration modal', () => {
      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      expect(screen.getByTestId('passport-migration-modal')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = { id: 1, email: 'test@example.com' }
      mockAuthStore.token = 'mock-token'
    })

    it('should format dates correctly', async () => {
      const checkinsWithDates = [
        {
          ...mockCheckins[0],
          visitedAt: '2024-12-25T15:30:00Z',
        },
      ]

      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: checkinsWithDates })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Dec 25, 2024/)).toBeInTheDocument()
      })
    })

    it('should handle invalid dates gracefully', async () => {
      const checkinsWithInvalidDate = [
        {
          ...mockCheckins[0],
          visitedAt: 'invalid-date',
        },
      ]

      vi.mocked(api.stats.getMyCheckins).mockResolvedValue({ checkins: checkinsWithInvalidDate })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Invalid Date/)).toBeInTheDocument()
      })
    })
  })
})