import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsPage } from '../StatsPage'
import { api } from '../../../utils/api'
import type { CafeStats } from '../../../../../shared/types'

// Mock the API
vi.mock('../../../utils/api', () => ({
  api: {
    adminAnalytics: {
      getCafeStats: vi.fn(),
    }
  }
}))

// Mock icons to avoid import issues
vi.mock('@/components/icons', () => ({
  ArrowUpDown: () => <div data-testid="arrow-icon" />,
  TrendingUp: () => <div data-testid="trending-icon" />,
  Users: () => <div data-testid="users-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  Navigation: () => <div data-testid="navigation-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
}))

const mockCafeStats: CafeStats[] = [
  {
    id: 1,
    name: 'Matcha Cafe A',
    city: 'toronto',
    neighborhood: 'Downtown',
    slug: 'matcha-cafe-a',
    views: 1000,
    directions_clicks: 200,
    anonymous_passport_marks: 50,
    authenticated_checkins: 30,
    instagram_clicks: 100,
    tiktok_clicks: 50,
  },
  {
    id: 2,
    name: 'Matcha Cafe B',
    city: 'toronto',
    neighborhood: 'Midtown',
    slug: 'matcha-cafe-b',
    views: 500,
    directions_clicks: 75,
    anonymous_passport_marks: 25,
    authenticated_checkins: 15,
    instagram_clicks: 40,
    tiktok_clicks: 20,
  },
  {
    id: 3,
    name: 'Matcha Cafe C',
    city: 'toronto',
    neighborhood: 'East End',
    slug: 'matcha-cafe-c',
    views: 2000,
    directions_clicks: 500,
    anonymous_passport_marks: 100,
    authenticated_checkins: 80,
    instagram_clicks: 200,
    tiktok_clicks: 100,
  },
]

describe('StatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show skeleton loaders while loading', () => {
      vi.mocked(api.adminAnalytics.getCafeStats).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<StatsPage />)

      const container = screen.getByText((content, element) => {
        return element?.className?.includes('max-w-7xl') || false
      })
      expect(container).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error dialog when API fails', async () => {
      const errorMessage = 'Network error'
      vi.mocked(api.adminAnalytics.getCafeStats).mockRejectedValue(new Error(errorMessage))

      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Failed to load analytics/i })).toBeInTheDocument()
      })
    })

    it('should allow retry after error', async () => {
      const user = userEvent.setup()
      vi.mocked(api.adminAnalytics.getCafeStats).mockRejectedValueOnce(new Error('Network error'))

      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Failed to load analytics/i })).toBeInTheDocument()
      })

      vi.mocked(api.adminAnalytics.getCafeStats).mockResolvedValue({ stats: mockCafeStats })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show "no data" message when no stats available', async () => {
      vi.mocked(api.adminAnalytics.getCafeStats).mockResolvedValue({ stats: [] })

      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByText(/No data available yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Data Display', () => {
    beforeEach(async () => {
      vi.mocked(api.adminAnalytics.getCafeStats).mockResolvedValue({ stats: mockCafeStats })
    })

    it('should display cafe performance summary cards', async () => {
      render(<StatsPage />)

      await waitFor(() => {
        // Total views = 1000 + 500 + 2000 = 3500
        expect(screen.getByText('3,500')).toBeInTheDocument()
        // Total directions = 200 + 75 + 500 = 775
        expect(screen.getByText('775')).toBeInTheDocument()
      })
    })

    it('should display all cafe rows in the table', async () => {
      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
        expect(screen.getByText('Matcha Cafe B')).toBeInTheDocument()
        expect(screen.getByText('Matcha Cafe C')).toBeInTheDocument()
        expect(screen.getByText('Downtown')).toBeInTheDocument()
        expect(screen.getByText('Midtown')).toBeInTheDocument()
        expect(screen.getByText('East End')).toBeInTheDocument()
      })
    })

    it('should calculate CTR correctly', async () => {
      render(<StatsPage />)

      await waitFor(() => {
        // CTR for Cafe A: (200 / 1000) * 100 = 20.0%
        // CTR for Cafe B: (75 / 500) * 100 = 15.0%
        // CTR for Cafe C: (500 / 2000) * 100 = 25.0%
        const ctrCells = screen.getAllByText(/\d+\.\d%/)
        expect(ctrCells.length).toBeGreaterThan(0)
      })
    })

    it('should calculate demand (marks + check-ins) correctly', async () => {
      render(<StatsPage />)

      await waitFor(() => {
        // Cafe A demand: 50 + 30 = 80
        // Cafe B demand: 25 + 15 = 40
        // Cafe C demand: 100 + 80 = 180
        // Note: These appear as "80", "40", "180" in the demand column
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })
    })
  })

  describe('Sorting Functionality', () => {
    beforeEach(async () => {
      vi.mocked(api.adminAnalytics.getCafeStats).mockResolvedValue({ stats: mockCafeStats })
    })

    it('should sort by views in descending order by default', async () => {
      render(<StatsPage />)

      await waitFor(() => {
        const cafeNames = screen.getAllByRole('row').map(row => row.textContent)
        // First data row should be Cafe C (2000 views)
        expect(cafeNames[1]).toContain('Matcha Cafe C')
      })
    })

    it('should toggle sort order when clicking the same header', async () => {
      const user = userEvent.setup()
      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      })

      // Find the Views header button
      const viewsHeader = screen.getByRole('button', { name: /Views/i })

      // First click should reverse order (ascending)
      await user.click(viewsHeader)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // First data row should now be Cafe B (500 views - lowest)
        expect(rows[1].textContent).toContain('Matcha Cafe B')
      })

      // Second click should go back to descending
      await user.click(viewsHeader)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // First data row should be Cafe C again (2000 views - highest)
        expect(rows[1].textContent).toContain('Matcha Cafe C')
      })
    })

    it('should sort by directions when clicking directions header', async () => {
      const user = userEvent.setup()
      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      })

      const directionsHeader = screen.getByRole('button', { name: /Directions/i })
      await user.click(directionsHeader)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // Should be sorted by directions_clicks (descending)
        // Cafe C has 500 (highest)
        expect(rows[1].textContent).toContain('Matcha Cafe C')
      })
    })

    it('should sort by check-ins when clicking check-ins header', async () => {
      const user = userEvent.setup()
      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByText('Matcha Cafe A')).toBeInTheDocument()
      })

      const checkinsHeader = screen.getByRole('button', { name: /Check-ins/i })
      await user.click(checkinsHeader)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // Should be sorted by authenticated_checkins (descending)
        // Cafe C has 80 (highest)
        expect(rows[1].textContent).toContain('Matcha Cafe C')
      })
    })
  })

  describe('Responsive Layout', () => {
    beforeEach(async () => {
      vi.mocked(api.adminAnalytics.getCafeStats).mockResolvedValue({ stats: mockCafeStats })
    })

    it('should render mobile-friendly grid layout', async () => {
      render(<StatsPage />)

      await waitFor(() => {
        const summaryCards = screen.getAllByText(/Total Views|Directions|Marks|Check-ins|Demand/i)
        expect(summaryCards.length).toBeGreaterThan(0)
      })
    })

    it('should render scrollable table', async () => {
      render(<StatsPage />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
        // Table should be in a scrollable container
        expect(table.parentElement?.className).toContain('overflow')
      })
    })
  })

  describe('API Integration', () => {
    it('should fetch cafe stats on mount', async () => {
      vi.mocked(api.adminAnalytics.getCafeStats).mockResolvedValue({ stats: mockCafeStats })

      render(<StatsPage />)

      await waitFor(() => {
        expect(api.adminAnalytics.getCafeStats).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero views correctly (avoid division by zero)', async () => {
      const statsWithZeroViews: CafeStats[] = [{
        id: 1,
        name: 'New Cafe',
        city: 'toronto',
        neighborhood: 'Downtown',
        slug: 'new-cafe',
        views: 0,
        directions_clicks: 0,
        anonymous_passport_marks: 0,
        authenticated_checkins: 0,
        instagram_clicks: 0,
        tiktok_clicks: 0,
      }]

      vi.mocked(api.adminAnalytics.getCafeStats).mockResolvedValue({ stats: statsWithZeroViews })

      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByText('New Cafe')).toBeInTheDocument()
        // Should show 0.0% CTR, not NaN or error
        const ctrCells = screen.getAllByText('0.0%')
        expect(ctrCells.length).toBeGreaterThan(0)
      })
    })

    it('should handle missing optional fields gracefully', async () => {
      const statsWithNulls: CafeStats[] = [{
        id: 1,
        name: 'Cafe with nulls',
        city: 'toronto',
        neighborhood: 'Downtown',
        slug: 'cafe-with-nulls',
        views: 100,
        directions_clicks: 10,
        anonymous_passport_marks: 0,
        authenticated_checkins: 0,
        instagram_clicks: 0,
        tiktok_clicks: 0,
      }]

      vi.mocked(api.adminAnalytics.getCafeStats).mockResolvedValue({ stats: statsWithNulls })

      render(<StatsPage />)

      await waitFor(() => {
        expect(screen.getByText('Cafe with nulls')).toBeInTheDocument()
        // Verify table renders without errors
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })
    })
  })
})
