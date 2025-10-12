import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { App } from '../../App'

// Mock react-router
const mockNavigate = vi.fn()
const mockUseLocation = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  }
})

// Mock useAppFeatures
vi.mock('../../hooks/useAppFeatures', () => ({
  useAppFeatures: () => ({
    showComingSoon: false,
    isFeedEnabled: true,
    isPassportEnabled: true,
    isEventsEnabled: true,
    isStoreEnabled: true,
  }),
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('App', () => {
  it('renders MatchaMap title', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
    renderWithRouter(<App />)
    expect(screen.getByText('MatchaMap')).toBeInTheDocument()
  })

  it('renders navigation tabs', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
    renderWithRouter(<App />)
    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.getByText('Feed')).toBeInTheDocument()
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('starts with map view selected', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
    renderWithRouter(<App />)
    const mapButton = screen.getByText('Map').closest('button')
    expect(mapButton).toHaveClass('text-green-600')
  })
})