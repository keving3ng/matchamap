import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PassportView } from '../PassportView'
import { useAuthStore } from '../../stores/authStore'
import { usePassportMigration } from '../../hooks/usePassportMigration'
import { api } from '../../utils/api'
import type { Cafe } from '../../types'

// Mock the dependencies
vi.mock('../../stores/authStore')
vi.mock('../../hooks/usePassportMigration')
vi.mock('../../utils/api')

const mockAuthStore = vi.mocked(useAuthStore)
const mockUsePassportMigration = vi.mocked(usePassportMigration)
const mockApi = vi.mocked(api)

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
  const mockCheckAndShowMigration = vi.fn()
  const mockCloseMigration = vi.fn()
  const mockMigrateStamps = vi.fn()
  const mockSkipMigration = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default auth store mock (unauthenticated)
    mockAuthStore.mockReturnValue({
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
    })

    // Default migration hook mock
    mockUsePassportMigration.mockReturnValue({
      migrationState: {
        isOpen: false,
        isLoading: false,
        error: null,
        localVisitCount: 0,
      },
      checkAndShowMigration: mockCheckAndShowMigration,
      closeMigration: mockCloseMigration,
      migrateStamps: mockMigrateStamps,
      skipMigration: mockSkipMigration,
    })

    // Default API mocks
    mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: [] })
    mockApi.stats.checkIn.mockResolvedValue(undefined)
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
      expect(mockApi.stats.getMyCheckins).not.toHaveBeenCalled()
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
      expect(mockApi.stats.checkIn).not.toHaveBeenCalled()
    })
  })

  describe('Authenticated Users', () => {
    beforeEach(() => {
      mockAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        refreshToken: vi.fn(),
        verifyEmail: vi.fn(),
        requestPasswordReset: vi.fn(),
        resetPassword: vi.fn(),
      })
    })

    it('should load check-ins from backend for authenticated users', async () => {
      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: mockCheckins })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(mockApi.stats.getMyCheckins).toHaveBeenCalledTimes(1)
      })

      // Should show visited status based on backend check-ins
      const visitedCard = screen.getByText('Test Cafe 1').closest('button')!
      expect(visitedCard).toHaveClass('scale-100')
    })

    it('should show timestamps for authenticated users', async () => {
      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: mockCheckins })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Visited on Jan 15, 2024/)).toBeInTheDocument()
      })
    })

    it('should show notes for authenticated users', async () => {
      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: mockCheckins })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Great experience!')).toBeInTheDocument()
      })
    })

    it('should use backend API for check-ins when authenticated', async () => {
      const user = userEvent.setup()
      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: [] })
      mockApi.stats.checkIn.mockResolvedValue(undefined)

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      const cafeCard = screen.getByText('Test Cafe 1').closest('button')!
      await user.click(cafeCard)

      await waitFor(() => {
        expect(mockApi.stats.checkIn).toHaveBeenCalledWith(1)
        expect(mockApi.stats.getMyCheckins).toHaveBeenCalledTimes(2) // Initial load + refresh
      })

      expect(mockOnToggleStamp).not.toHaveBeenCalled()
    })

    it('should handle check-in API errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: [] })
      mockApi.stats.checkIn.mockRejectedValue(new Error('Network error'))

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      const cafeCard = screen.getByText('Test Cafe 1').closest('button')!
      await user.click(cafeCard)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error checking in:', expect.any(Error))
      })

      // Button should no longer be loading
      expect(cafeCard).not.toHaveClass('animate-pulse')
      expect(cafeCard).not.toBeDisabled()

      consoleSpy.mockRestore()
    })

    it('should show loading state during backend check-in', async () => {
      const user = userEvent.setup()
      let resolveCheckIn: () => void
      const checkInPromise = new Promise<void>((resolve) => {
        resolveCheckIn = resolve
      })
      
      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: [] })
      mockApi.stats.checkIn.mockReturnValue(checkInPromise)

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      const cafeCard = screen.getByText('Test Cafe 1').closest('button')!
      await user.click(cafeCard)

      // Should show loading state
      expect(cafeCard).toHaveClass('animate-pulse')
      expect(cafeCard).toBeDisabled()

      // Resolve the check-in
      resolveCheckIn!()
      await waitFor(() => {
        expect(cafeCard).not.toHaveClass('animate-pulse')
        expect(cafeCard).not.toBeDisabled()
      })
    })

    it('should handle failed check-ins load', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockApi.stats.getMyCheckins.mockRejectedValue(new Error('Server error'))

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
      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: [] })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(mockCheckAndShowMigration).toHaveBeenCalled()
      })
    })
  })

  describe('Migration Modal', () => {
    beforeEach(() => {
      mockAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        refreshToken: vi.fn(),
        verifyEmail: vi.fn(),
        requestPasswordReset: vi.fn(),
        resetPassword: vi.fn(),
      })

      mockUsePassportMigration.mockReturnValue({
        migrationState: {
          isOpen: true,
          isLoading: false,
          error: null,
          localVisitCount: 3,
        },
        checkAndShowMigration: mockCheckAndShowMigration,
        closeMigration: mockCloseMigration,
        migrateStamps: mockMigrateStamps,
        skipMigration: mockSkipMigration,
      })
    })

    it('should render migration modal when open', () => {
      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      expect(screen.getByText('Sync Your Passport')).toBeInTheDocument()
    })

    it('should pass correct props to migration modal', () => {
      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      expect(screen.getByText('3 local visits found')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly', async () => {
      const checkinsWithDates = [
        {
          ...mockCheckins[0],
          visitedAt: '2024-12-25T15:30:00Z',
        },
      ]
      
      mockAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        refreshToken: vi.fn(),
        verifyEmail: vi.fn(),
        requestPasswordReset: vi.fn(),
        resetPassword: vi.fn(),
      })

      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: checkinsWithDates })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Visited on Dec 25, 2024/)).toBeInTheDocument()
      })
    })

    it('should handle invalid dates gracefully', async () => {
      const checkinsWithInvalidDate = [
        {
          ...mockCheckins[0],
          visitedAt: 'invalid-date',
        },
      ]
      
      mockAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-token',
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        refreshToken: vi.fn(),
        verifyEmail: vi.fn(),
        requestPasswordReset: vi.fn(),
        resetPassword: vi.fn(),
      })

      mockApi.stats.getMyCheckins.mockResolvedValue({ checkins: checkinsWithInvalidDate })

      render(
        <PassportView
          cafes={mockCafes}
          visitedStamps={[]}
          onToggleStamp={mockOnToggleStamp}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Visited on Unknown date/)).toBeInTheDocument()
      })
    })
  })
})