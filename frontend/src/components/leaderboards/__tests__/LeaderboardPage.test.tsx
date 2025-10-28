import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LeaderboardPage } from '../LeaderboardPage'
import { useAuthStore } from '../../../stores/authStore'
import { useUserFeatures } from '../../../hooks/useUserFeatures'
import { api } from '../../../utils/api'

// Mock the API
vi.mock('../../../utils/api', () => ({
  api: {
    leaderboard: {
      getPassportLeaderboard: vi.fn(),
      getReviewerLeaderboard: vi.fn(),
      getContributorLeaderboard: vi.fn(),
      getUserRank: vi.fn(),
    },
  },
}))

// Mock the hooks
vi.mock('../../../stores/authStore')
vi.mock('../../../hooks/useUserFeatures')

// Mock data
const mockPassportLeaderboard = {
  leaderboard: [
    {
      rank: 1,
      userId: 1,
      username: 'matcha_master',
      displayName: 'Matcha Master',
      avatarUrl: 'https://example.com/avatar1.jpg',
      totalCheckins: 45,
      passportCompletion: 90,
      location: 'Toronto, ON',
    },
    {
      rank: 2,
      userId: 2,
      username: 'tea_explorer',
      displayName: 'Tea Explorer',
      avatarUrl: null,
      totalCheckins: 38,
      passportCompletion: 76,
      location: 'Montreal, QC',
    },
  ],
  metadata: {
    type: 'passport',
    period: 'all',
    city: 'all',
    limit: 50,
    generatedAt: '2024-01-01T00:00:00Z',
  },
}

const mockReviewerLeaderboard = {
  leaderboard: [
    {
      rank: 1,
      userId: 1,
      username: 'reviewer_pro',
      displayName: 'Reviewer Pro',
      avatarUrl: 'https://example.com/avatar2.jpg',
      totalReviews: 25,
      reputationScore: 4.8,
      location: 'Toronto, ON',
    },
  ],
  metadata: {
    type: 'reviewers',
    period: 'all',
    city: 'all',
    limit: 50,
    generatedAt: '2024-01-01T00:00:00Z',
  },
}

const mockContributorLeaderboard = {
  leaderboard: [
    {
      rank: 1,
      userId: 1,
      username: 'contributor_hero',
      displayName: 'Contributor Hero',
      avatarUrl: 'https://example.com/avatar3.jpg',
      totalReviews: 15,
      totalPhotos: 30,
      totalFavorites: 20,
      totalContributions: 65,
      reputationScore: 4.9,
      location: 'Vancouver, BC',
    },
  ],
  metadata: {
    type: 'contributors',
    period: 'all',
    city: 'all',
    limit: 50,
    generatedAt: '2024-01-01T00:00:00Z',
  },
}

const mockUserRank = {
  userRank: {
    rank: 5,
    userId: 123,
    totalCheckins: 20,
  },
  metadata: {
    type: 'passport',
    period: 'all',
    city: 'all',
    userId: 123,
    generatedAt: '2024-01-01T00:00:00Z',
  },
}

const renderLeaderboardPage = () => {
  return render(
    <MemoryRouter>
      <LeaderboardPage />
    </MemoryRouter>
  )
}

// TODO: Fix leaderboard tests after component refactoring
describe.skip('LeaderboardPage', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(useUserFeatures).mockReturnValue({
      isUserAccountsEnabled: true,
      isUserProfilesEnabled: true,
      isUserSocialEnabled: true,
      isUserCheckinsEnabled: true,
      isUserReviewsEnabled: true,
      isUserPhotosEnabled: true,
      isUserFollowingEnabled: true,
      isUserFavoritesEnabled: true,
      isUserListsEnabled: true,
      hasAnyUserFeatures: true,
    })
    
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      user: null,
      // Add other required authStore properties as needed
    } as any)
    
    // Default API mocks
    vi.mocked(api.leaderboard.getPassportLeaderboard).mockResolvedValue(mockPassportLeaderboard)
    vi.mocked(api.leaderboard.getReviewerLeaderboard).mockResolvedValue(mockReviewerLeaderboard)
    vi.mocked(api.leaderboard.getContributorLeaderboard).mockResolvedValue(mockContributorLeaderboard)
    vi.mocked(api.leaderboard.getUserRank).mockResolvedValue(mockUserRank)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Feature Flag Control', () => {
    it('does not render when social features are disabled', () => {
      vi.mocked(useUserFeatures).mockReturnValue({
        hasUserAccounts: true,
        hasUserProfiles: true,
        hasUserSocial: false,
      })

      const { container } = renderLeaderboardPage()
      expect(container.firstChild).toBeNull()
    })

    it('renders when social features are enabled', () => {
      renderLeaderboardPage()
      expect(screen.getByRole('heading', { name: /leaderboards/i })).toBeInTheDocument()
    })
  })

  describe('Initial Render', () => {
    it('renders header with title and subtitle', () => {
      renderLeaderboardPage()
      
      expect(screen.getByRole('heading', { name: /leaderboards/i })).toBeInTheDocument()
      expect(screen.getByText(/discover the top community members/i)).toBeInTheDocument()
    })

    it('renders tab navigation', () => {
      renderLeaderboardPage()
      
      expect(screen.getByRole('button', { name: /passport/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reviewers/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /contributors/i })).toBeInTheDocument()
    })

    it('renders time period filters', () => {
      renderLeaderboardPage()
      
      expect(screen.getByRole('button', { name: /all time/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /this month/i })).toBeInTheDocument()
    })

    it('starts with passport tab active', () => {
      renderLeaderboardPage()
      
      const passportTab = screen.getByRole('button', { name: /passport/i })
      expect(passportTab).toHaveClass('bg-green-600', 'text-white')
    })
  })

  describe('Tab Switching', () => {
    it('switches to reviewers tab when clicked', async () => {
      renderLeaderboardPage()
      
      const reviewersTab = screen.getByRole('button', { name: /reviewers/i })
      fireEvent.click(reviewersTab)
      
      await waitFor(() => {
        expect(reviewersTab).toHaveClass('bg-green-600', 'text-white')
      })
      
      expect(vi.mocked(api.leaderboard.getReviewerLeaderboard)).toHaveBeenCalled()
    })

    it('switches to contributors tab when clicked', async () => {
      renderLeaderboardPage()
      
      const contributorsTab = screen.getByRole('button', { name: /contributors/i })
      fireEvent.click(contributorsTab)
      
      await waitFor(() => {
        expect(contributorsTab).toHaveClass('bg-green-600', 'text-white')
      })
      
      expect(vi.mocked(api.leaderboard.getContributorLeaderboard)).toHaveBeenCalled()
    })

    it('updates tab description when switching tabs', async () => {
      renderLeaderboardPage()
      
      // Initially shows passport description
      expect(screen.getByText(/members who have visited the most cafes/i)).toBeInTheDocument()
      
      // Switch to reviewers tab
      const reviewersTab = screen.getByRole('button', { name: /reviewers/i })
      fireEvent.click(reviewersTab)
      
      await waitFor(() => {
        expect(screen.getByText(/members who have written the most helpful reviews/i)).toBeInTheDocument()
      })
    })
  })

  describe('Time Period Filtering', () => {
    it('switches to monthly period when clicked', async () => {
      renderLeaderboardPage()
      
      const monthlyButton = screen.getByRole('button', { name: /this month/i })
      fireEvent.click(monthlyButton)
      
      await waitFor(() => {
        expect(monthlyButton).toHaveClass('bg-white', 'text-green-600')
      })
      
      expect(vi.mocked(api.leaderboard.getPassportLeaderboard)).toHaveBeenCalledWith({
        period: 'monthly',
        city: undefined,
        limit: 50,
      })
    })
  })

  describe('Data Display', () => {
    it('displays passport leaderboard data correctly', async () => {
      renderLeaderboardPage()
      
      await waitFor(() => {
        expect(screen.getByText('Matcha Master')).toBeInTheDocument()
        expect(screen.getByText('@matcha_master')).toBeInTheDocument()
        expect(screen.getByText('45 check-ins')).toBeInTheDocument()
        expect(screen.getByText('90% complete')).toBeInTheDocument()
        expect(screen.getByText('📍 Toronto, ON')).toBeInTheDocument()
      })
    })

    it('displays rank badges correctly', async () => {
      renderLeaderboardPage()
      
      await waitFor(() => {
        expect(screen.getByText('🥇')).toBeInTheDocument() // First place
        expect(screen.getByText('🥈')).toBeInTheDocument() // Second place
      })
    })

    it('handles missing avatar with initials fallback', async () => {
      renderLeaderboardPage()
      
      await waitFor(() => {
        expect(screen.getByText('TE')).toBeInTheDocument() // Tea Explorer initials
      })
    })
  })

  describe('User Rank Display', () => {
    it('shows user rank when authenticated and has rank', async () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: { id: 123 },
      } as any)

      renderLeaderboardPage()
      
      await waitFor(() => {
        expect(screen.getByText(/your rank/i)).toBeInTheDocument()
        expect(screen.getByText(/you are ranked #5/i)).toBeInTheDocument()
      })
    })

    it('does not show user rank when not authenticated', () => {
      renderLeaderboardPage()
      
      expect(screen.queryByText(/your rank/i)).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading skeletons while fetching data', () => {
      // Mock API to never resolve
      vi.mocked(api.leaderboard.getPassportLeaderboard).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderLeaderboardPage()
      
      // Should show multiple skeleton loaders
      const skeletons = screen.getAllByTestId(/skeleton|loading/)
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('shows error message when API fails', async () => {
      vi.mocked(api.leaderboard.getPassportLeaderboard).mockRejectedValue(
        new Error('API Error')
      )

      renderLeaderboardPage()
      
      await waitFor(() => {
        expect(screen.getByText(/unable to load leaderboard/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('allows retry after error', async () => {
      // First call fails
      vi.mocked(api.leaderboard.getPassportLeaderboard)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockPassportLeaderboard)

      renderLeaderboardPage()
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/unable to load leaderboard/i)).toBeInTheDocument()
      })
      
      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)
      
      // Should show data after retry
      await waitFor(() => {
        expect(screen.getByText('Matcha Master')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no data available', async () => {
      vi.mocked(api.leaderboard.getPassportLeaderboard).mockResolvedValue({
        ...mockPassportLeaderboard,
        leaderboard: [],
      })

      renderLeaderboardPage()
      
      await waitFor(() => {
        expect(screen.getByText(/no data available/i)).toBeInTheDocument()
        expect(screen.getByText(/be the first to appear on this leaderboard/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderLeaderboardPage()
      
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent(/leaderboards/i)
    })

    it('has accessible button labels', () => {
      renderLeaderboardPage()
      
      const passportTab = screen.getByRole('button', { name: /passport/i })
      expect(passportTab).toBeInTheDocument()
    })
  })
})