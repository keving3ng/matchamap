import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AdminWrapper } from '../AdminWrapper'

// Mock admin store
const mockAdminStore = {
  adminModeActive: false,
  environment: 'dev' as 'dev' | 'prod',
  setEnvironment: vi.fn(),
  setFeatureOverride: vi.fn(),
  featureOverrides: {},
}

vi.mock('../../stores/adminStore', () => ({
  useAdminStore: () => mockAdminStore,
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

// Mock feature toggle
const mockGetCurrentEnvironment = vi.fn()
vi.mock('../../hooks/useFeatureToggle', () => ({
  getCurrentEnvironment: () => mockGetCurrentEnvironment(),
}))

// Mock COPY constants
vi.mock('../../constants/copy', () => ({
  COPY: {
    admin: {
      mode: 'Admin Mode',
    },
  },
}))

// Mock react-router
const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('AdminWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminStore.adminModeActive = false
    mockAdminStore.environment = 'dev'
    mockAdminStore.featureOverrides = {}
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null
    mockGetCurrentEnvironment.mockReturnValue('dev')
  })

  it('should render children without banner when not in dev mode and not authenticated', () => {
    mockGetCurrentEnvironment.mockReturnValue('production')
    mockAdminStore.adminModeActive = false

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.queryByText('Admin Mode')).not.toBeInTheDocument()
  })

  it('should show admin banner when in dev mode with admin mode active', () => {
    mockGetCurrentEnvironment.mockReturnValue('dev')
    mockAdminStore.adminModeActive = true

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('dev Mode')).toBeInTheDocument()
  })

  it('should show admin banner when authenticated as admin', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    }

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('Admin Mode')).toBeInTheDocument()
    expect(screen.getByText('admin (admin)')).toBeInTheDocument()
  })

  it('should show logout button for authenticated admin', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    }

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should handle logout click', async () => {
    const user = userEvent.setup()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    }

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    const logoutButton = screen.getByText('Logout')
    await user.click(logoutButton)

    expect(mockAuthStore.logout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should show admin panel button', () => {
    mockGetCurrentEnvironment.mockReturnValue('dev')
    mockAdminStore.adminModeActive = true

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
  })

  it('should navigate to admin when admin panel button clicked', async () => {
    const user = userEvent.setup()
    mockGetCurrentEnvironment.mockReturnValue('dev')
    mockAdminStore.adminModeActive = true

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    const adminButton = screen.getByText('Admin Panel')
    await user.click(adminButton)

    expect(mockNavigate).toHaveBeenCalledWith('/admin')
    expect(mockAdminStore.setFeatureOverride).toHaveBeenCalledWith('ENABLE_ADMIN_PANEL', true)
    expect(mockAdminStore.setFeatureOverride).toHaveBeenCalledWith('ENABLE_MENU', true)
  })

  it('should show switch to dev button in prod mode', () => {
    mockGetCurrentEnvironment.mockReturnValue('dev')
    mockAdminStore.adminModeActive = true
    mockAdminStore.environment = 'prod'

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('Switch to Dev')).toBeInTheDocument()
  })

  it('should switch to dev mode when button clicked', async () => {
    const user = userEvent.setup()
    mockGetCurrentEnvironment.mockReturnValue('dev')
    mockAdminStore.adminModeActive = true
    mockAdminStore.environment = 'prod'

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    const switchButton = screen.getByText('Switch to Dev')
    await user.click(switchButton)

    expect(mockAdminStore.setEnvironment).toHaveBeenCalledWith('dev')
  })

  it('should show feature override count', () => {
    mockGetCurrentEnvironment.mockReturnValue('dev')
    mockAdminStore.adminModeActive = true
    mockAdminStore.featureOverrides = {
      FEATURE_1: true,
      FEATURE_2: false,
      FEATURE_3: true,
    }

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('3 overrides active')).toBeInTheDocument()
  })

  it('should render children when banner is shown', () => {
    mockGetCurrentEnvironment.mockReturnValue('dev')
    mockAdminStore.adminModeActive = true

    renderWithRouter(
      <AdminWrapper>
        <div>Test Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
