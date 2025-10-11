import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { useNavigate, useLocation } from 'react-router'
import { Header } from '../Header'

// Mock react-router
const mockNavigate = vi.fn()
const mockUseLocation = vi.fn()

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}))

// Mock copy constants
vi.mock('../../constants/copy', () => ({
  COPY: {
    header: {
      title: 'MatchaMap',
      instagramAriaLabel: 'Follow us on Instagram',
      tiktokAriaLabel: 'Follow us on TikTok',
    },
    map: {
      backToMap: 'Back to Map',
    },
    menu: {
      myProfile: 'My Profile',
      signOut: 'Sign Out',
      signIn: 'Sign In',
      about: 'About',
      shop: 'Shop',
      contact: 'Contact',
      settings: 'Settings',
    },
  },
}))

// Mock feature toggles
vi.mock('../../hooks/useFeatureToggle', () => ({
  useFeatureToggle: (flag: string) => {
    const flags: Record<string, boolean> = {
      ENABLE_MENU: true,
      ENABLE_USER_ACCOUNTS: true,
      ENABLE_USER_PROFILES: true,
      ENABLE_CONTACT: true,
      ENABLE_ABOUT: true,
      ENABLE_STORE: true,
      ENABLE_SETTINGS: true,
    }
    return flags[flag] ?? false
  },
}))

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null,
  logout: vi.fn(),
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock document.referrer
Object.defineProperty(document, 'referrer', {
  value: '',
  writable: true,
})

Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null
    mockUseLocation.mockReturnValue({ pathname: '/' })
  })

  it('should render header with logo and title', () => {
    renderWithRouter(<Header />)

    expect(screen.getByText('MatchaMap')).toBeInTheDocument()
    expect(screen.getByText('🍵')).toBeInTheDocument()
  })

  it('should render social media links', () => {
    renderWithRouter(<Header />)

    const instagramLink = screen.getByLabelText('Follow us on Instagram')
    const tiktokLink = screen.getByLabelText('Follow us on TikTok')

    expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/vivisual.diary')
    expect(instagramLink).toHaveAttribute('target', '_blank')
    expect(tiktokLink).toHaveAttribute('href', 'https://www.tiktok.com/@vivisual.diary')
    expect(tiktokLink).toHaveAttribute('target', '_blank')
  })

  it('should show back button on detail view', () => {
    mockUseLocation.mockReturnValue({ pathname: '/cafe/test-cafe' })
    renderWithRouter(<Header />)

    expect(screen.getByLabelText('Back to Map')).toBeInTheDocument()
  })

  it('should not show back button on map view', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' })
    renderWithRouter(<Header />)

    expect(screen.queryByLabelText('Back to Map')).not.toBeInTheDocument()
  })

  it('should navigate home when clicking logo', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const logoButton = screen.getByText('🍵').closest('button')!
    await user.click(logoButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should handle back button click from detail view', async () => {
    const user = userEvent.setup()
    mockUseLocation.mockReturnValue({ pathname: '/cafe/test-cafe' })
    
    // Mock referrer as coming from homepage
    Object.defineProperty(document, 'referrer', {
      value: 'http://localhost:3000/',
      writable: true,
    })

    renderWithRouter(<Header />)

    const backButton = screen.getByLabelText('Back to Map')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should use browser back when not coming from homepage', async () => {
    const user = userEvent.setup()
    mockUseLocation.mockReturnValue({ pathname: '/cafe/test-cafe' })
    
    // Mock referrer as coming from external site
    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com',
      writable: true,
    })

    renderWithRouter(<Header />)

    const backButton = screen.getByLabelText('Back to Map')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('should render menu button when menu is enabled', () => {
    renderWithRouter(<Header />)

    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() // Menu button
  })

  it('should toggle menu dropdown on click', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg' // Menu icon
    )!

    // Menu should not be visible initially
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()

    // Click to open menu
    await user.click(menuButton)
    expect(screen.getByText('Sign In')).toBeInTheDocument()

    // Click to close menu
    await user.click(menuButton)
    await waitFor(() => {
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    })
  })

  it('should close menu when clicking outside', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    // Open menu
    await user.click(menuButton)
    expect(screen.getByText('Sign In')).toBeInTheDocument()

    // Click outside
    await user.click(document.body)
    await waitFor(() => {
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    })
  })

  it('should show sign in when not authenticated', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('should show user options when authenticated', async () => {
    const user = userEvent.setup()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: 1, username: 'testuser', email: 'test@example.com' }

    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should navigate to login when clicking sign in', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    const signInButton = screen.getByText('Sign In')
    await user.click(signInButton)

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('should handle logout when clicking sign out', async () => {
    const user = userEvent.setup()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: 1, username: 'testuser', email: 'test@example.com' }

    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    const signOutButton = screen.getByText('Sign Out')
    await user.click(signOutButton)

    expect(mockAuthStore.logout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should navigate to profile when clicking my profile', async () => {
    const user = userEvent.setup()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: 1, username: 'testuser', email: 'test@example.com' }

    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    const profileButton = screen.getByText('My Profile')
    await user.click(profileButton)

    expect(mockNavigate).toHaveBeenCalledWith('/profile/testuser')
  })

  it('should navigate to about when clicking about', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    const aboutButton = screen.getByText('About')
    await user.click(aboutButton)

    expect(mockNavigate).toHaveBeenCalledWith('/about')
  })

  it('should navigate to store when clicking shop', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    const shopButton = screen.getByText('Shop')
    await user.click(shopButton)

    expect(mockNavigate).toHaveBeenCalledWith('/store')
  })

  it('should navigate to contact when clicking contact', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    const contactButton = screen.getByText('Contact')
    await user.click(contactButton)

    expect(mockNavigate).toHaveBeenCalledWith('/contact')
  })

  it('should navigate to settings when clicking settings', async () => {
    const user = userEvent.setup()
    mockAuthStore.isAuthenticated = true

    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    const settingsButton = screen.getByText('Settings')
    await user.click(settingsButton)

    expect(mockNavigate).toHaveBeenCalledWith('/settings')
  })

  it('should determine current view correctly from pathname', () => {
    // Test list view
    mockUseLocation.mockReturnValue({ pathname: '/list' })
    const { rerender } = renderWithRouter(<Header />)
    // Should not show back button
    expect(screen.queryByLabelText('Back to Map')).not.toBeInTheDocument()

    // Test feed view
    mockUseLocation.mockReturnValue({ pathname: '/feed' })
    rerender(<Header />)
    expect(screen.queryByLabelText('Back to Map')).not.toBeInTheDocument()

    // Test passport view
    mockUseLocation.mockReturnValue({ pathname: '/passport' })
    rerender(<Header />)
    expect(screen.queryByLabelText('Back to Map')).not.toBeInTheDocument()

    // Test events view
    mockUseLocation.mockReturnValue({ pathname: '/events' })
    rerender(<Header />)
    expect(screen.queryByLabelText('Back to Map')).not.toBeInTheDocument()

    // Test detail view
    mockUseLocation.mockReturnValue({ pathname: '/cafe/test-cafe' })
    rerender(<Header />)
    expect(screen.getByLabelText('Back to Map')).toBeInTheDocument()
  })

  it('should be accessible with proper ARIA labels', () => {
    renderWithRouter(<Header />)

    expect(screen.getByLabelText('Follow us on Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('Follow us on TikTok')).toBeInTheDocument()
  })

  it('should close menu after navigation clicks', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    // Open menu
    await user.click(menuButton)
    expect(screen.getByText('About')).toBeInTheDocument()

    // Click about - should close menu
    const aboutButton = screen.getByText('About')
    await user.click(aboutButton)

    await waitFor(() => {
      expect(screen.queryByText('About')).not.toBeInTheDocument()
    })
  })

  it('should only show settings when authenticated', async () => {
    const user = userEvent.setup()
    
    // Test unauthenticated
    mockAuthStore.isAuthenticated = false
    renderWithRouter(<Header />)

    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.tagName === 'svg'
    )!

    await user.click(menuButton)
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()

    // Close menu and test authenticated
    await user.click(menuButton)
    mockAuthStore.isAuthenticated = true

    await user.click(menuButton)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})