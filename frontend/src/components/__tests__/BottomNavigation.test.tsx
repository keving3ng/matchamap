import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router'
import { BottomNavigation } from '../BottomNavigation'

// Mock react-router
const mockNavigate = vi.fn()
const mockUseLocation = vi.fn()

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}))

// Mock feature toggles
const mockGetCurrentEnvironment = vi.fn()
const mockUseAppFeatures = vi.fn()

vi.mock('../../hooks/useFeatureToggle', () => ({
  getCurrentEnvironment: () => mockGetCurrentEnvironment(),
}))

vi.mock('../../hooks/useAppFeatures', () => ({
  useAppFeatures: () => mockUseAppFeatures(),
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('BottomNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCurrentEnvironment.mockReturnValue('production')
    mockUseAppFeatures.mockReturnValue({
      isPassportEnabled: true,
      isFeedEnabled: true,
      isEventsEnabled: true,
    })
    mockUseLocation.mockReturnValue({ pathname: '/' })
  })

  it('should render all navigation buttons when features are enabled', () => {
    renderWithRouter(<BottomNavigation />)

    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.getByText('Feed')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('should highlight active map view', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
    renderWithRouter(<BottomNavigation />)

    const mapButton = screen.getByText('Map').closest('button')!
    const listButton = screen.getByText('List').closest('button')!

    expect(mapButton).toHaveClass('text-green-600')
    expect(listButton).toHaveClass('text-gray-400')
  })

  it('should highlight active list view', () => {
    mockUseLocation.mockReturnValue({ pathname: '/list' })
    renderWithRouter(<BottomNavigation />)

    const mapButton = screen.getByText('Map').closest('button')!
    const listButton = screen.getByText('List').closest('button')!

    expect(mapButton).toHaveClass('text-gray-400')
    expect(listButton).toHaveClass('text-green-600')
  })

  it('should highlight active feed view', () => {
    mockUseLocation.mockReturnValue({ pathname: '/feed' })
    renderWithRouter(<BottomNavigation />)

    const feedButton = screen.getByText('Feed').closest('button')!
    expect(feedButton).toHaveClass('text-green-600')
  })

  it('should highlight active events view', () => {
    mockUseLocation.mockReturnValue({ pathname: '/events' })
    renderWithRouter(<BottomNavigation />)

    const eventsButton = screen.getByText('Events').closest('button')!
    expect(eventsButton).toHaveClass('text-green-600')
  })

  it('should highlight active passport view', () => {
    mockUseLocation.mockReturnValue({ pathname: '/passport' })
    renderWithRouter(<BottomNavigation />)

    const passportButton = screen.getByText('Passport').closest('button')!
    expect(passportButton).toHaveClass('text-green-600')
  })

  it('should not highlight any button on detail view', () => {
    mockUseLocation.mockReturnValue({ pathname: '/cafe/test-cafe' })
    renderWithRouter(<BottomNavigation />)

    const mapButton = screen.getByText('Map').closest('button')!
    const listButton = screen.getByText('List').closest('button')!

    expect(mapButton).toHaveClass('text-gray-400')
    expect(listButton).toHaveClass('text-gray-400')
  })

  it('should navigate to map when clicking map button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<BottomNavigation />)

    const mapButton = screen.getByText('Map')
    await user.click(mapButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should navigate to list when clicking list button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<BottomNavigation />)

    const listButton = screen.getByText('List')
    await user.click(listButton)

    expect(mockNavigate).toHaveBeenCalledWith('/list')
  })

  it('should navigate to feed when clicking feed button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<BottomNavigation />)

    const feedButton = screen.getByText('Feed')
    await user.click(feedButton)

    expect(mockNavigate).toHaveBeenCalledWith('/feed')
  })

  it('should navigate to events when clicking events button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<BottomNavigation />)

    const eventsButton = screen.getByText('Events')
    await user.click(eventsButton)

    expect(mockNavigate).toHaveBeenCalledWith('/events')
  })

  it('should navigate to passport when clicking passport button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<BottomNavigation />)

    const passportButton = screen.getByText('Passport')
    await user.click(passportButton)

    expect(mockNavigate).toHaveBeenCalledWith('/passport')
  })

  it('should not render feed button when feed is disabled', () => {
    mockUseAppFeatures.mockReturnValue({
      isPassportEnabled: true,
      isFeedEnabled: false,
      isEventsEnabled: true,
    })

    renderWithRouter(<BottomNavigation />)

    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.queryByText('Feed')).not.toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('should not render events button when events is disabled', () => {
    mockUseAppFeatures.mockReturnValue({
      isPassportEnabled: true,
      isFeedEnabled: true,
      isEventsEnabled: false,
    })

    renderWithRouter(<BottomNavigation />)

    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.getByText('Feed')).toBeInTheDocument()
    expect(screen.queryByText('Events')).not.toBeInTheDocument()
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('should not render passport button when passport is disabled', () => {
    mockUseAppFeatures.mockReturnValue({
      isPassportEnabled: false,
      isFeedEnabled: true,
      isEventsEnabled: true,
    })

    renderWithRouter(<BottomNavigation />)

    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.getByText('Feed')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.queryByText('Passport')).not.toBeInTheDocument()
  })

  it('should render only map and list when all optional features are disabled', () => {
    mockUseAppFeatures.mockReturnValue({
      isPassportEnabled: false,
      isFeedEnabled: false,
      isEventsEnabled: false,
    })

    renderWithRouter(<BottomNavigation />)

    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.queryByText('Feed')).not.toBeInTheDocument()
    expect(screen.queryByText('Events')).not.toBeInTheDocument()
    expect(screen.queryByText('Passport')).not.toBeInTheDocument()
  })

  it('should apply different stroke width for active vs inactive buttons', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
    renderWithRouter(<BottomNavigation />)

    const mapIcon = screen.getByText('Map').previousSibling as SVGElement
    const listIcon = screen.getByText('List').previousSibling as SVGElement

    // Active (map) should have strokeWidth 2.5
    expect(mapIcon).toHaveAttribute('stroke-width', '2.5')
    // Inactive (list) should have strokeWidth 2
    expect(listIcon).toHaveAttribute('stroke-width', '2')
  })

  it('should apply font weight correctly for active vs inactive text', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
    renderWithRouter(<BottomNavigation />)

    const mapText = screen.getByText('Map')
    const listText = screen.getByText('List')

    expect(mapText).toHaveClass('font-semibold')
    expect(listText).not.toHaveClass('font-semibold')
  })

  it('should adjust padding for admin banner in dev environment', () => {
    mockGetCurrentEnvironment.mockReturnValue('dev')
    const { container } = renderWithRouter(<BottomNavigation />)

    const navigation = container.querySelector('.bg-white.border-t-2')
    expect(navigation).toHaveStyle({
      paddingBottom: 'calc(0.75rem + var(--admin-banner-height, 0px))',
    })
  })

  it('should use normal padding in production environment', () => {
    mockGetCurrentEnvironment.mockReturnValue('production')
    const { container } = renderWithRouter(<BottomNavigation />)

    const navigation = container.querySelector('.bg-white.border-t-2')
    expect(navigation).toHaveStyle({
      paddingBottom: '0.75rem',
    })
  })

  it('should be accessible with proper button roles', () => {
    renderWithRouter(<BottomNavigation />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5) // All 5 navigation buttons

    buttons.forEach(button => {
      expect(button).toBeEnabled()
    })
  })

  it('should handle unknown pathname gracefully', () => {
    mockUseLocation.mockReturnValue({ pathname: '/unknown-route' })
    renderWithRouter(<BottomNavigation />)

    // Should default to map view (map button highlighted)
    const mapButton = screen.getByText('Map').closest('button')!
    const listButton = screen.getByText('List').closest('button')!

    expect(mapButton).toHaveClass('text-green-600')
    expect(listButton).toHaveClass('text-gray-400')
  })

  it('should determine current view correctly from various paths', () => {
    const testCases = [
      { pathname: '/', expectedActive: 'Map' },
      { pathname: '/list', expectedActive: 'List' },
      { pathname: '/feed', expectedActive: 'Feed' },
      { pathname: '/passport', expectedActive: 'Passport' },
      { pathname: '/events', expectedActive: 'Events' },
      { pathname: '/toronto/test-cafe', expectedActive: 'detail' }, // detail view (new route pattern)
      { pathname: '/toronto/another-cafe-slug', expectedActive: 'detail' }, // detail view
    ]

    testCases.forEach(({ pathname, expectedActive }) => {
      mockUseLocation.mockReturnValue({ pathname })
      const { unmount } = renderWithRouter(<BottomNavigation />)

      if (expectedActive === 'detail') {
        // For detail view, no button should be active (defaults to map but not highlighted)
        const mapButton = screen.getByText('Map').closest('button')!
        expect(mapButton).toHaveClass('text-gray-400')
      } else if (expectedActive) {
        const activeButton = screen.getByText(expectedActive).closest('button')!
        expect(activeButton).toHaveClass('text-green-600')
      }

      // Cleanup between test cases
      unmount()
    })
  })
})