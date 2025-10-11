import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AdminWrapper } from '../AdminWrapper'

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null,
  isAdmin: false,
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock react-router
const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  ...vi.importActual('react-router'),
  useNavigate: () => mockNavigate,
}))

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
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null
    mockAuthStore.isAdmin = false
  })

  it('should render children when user is admin', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: 1, email: 'admin@example.com', role: 'admin' }
    mockAuthStore.isAdmin = true

    renderWithRouter(
      <AdminWrapper>
        <div>Admin Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should show unauthorized message when user is not authenticated', () => {
    renderWithRouter(
      <AdminWrapper>
        <div>Admin Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument()
    expect(screen.getByText(/You need to be logged in as an administrator/i)).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should show unauthorized message when user is authenticated but not admin', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: 1, email: 'user@example.com', role: 'user' }
    mockAuthStore.isAdmin = false

    renderWithRouter(
      <AdminWrapper>
        <div>Admin Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    renderWithRouter(
      <AdminWrapper>
        <div>Admin Content</div>
      </AdminWrapper>
    )

    const loginButton = screen.getByText(/Go to Login/i)
    expect(loginButton).toBeInTheDocument()
  })

  it('should handle loading state during auth check', () => {
    mockAuthStore.isAuthenticated = null // Loading state
    
    renderWithRouter(
      <AdminWrapper>
        <div>Admin Content</div>
      </AdminWrapper>
    )

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should be accessible with proper heading structure', () => {
    renderWithRouter(
      <AdminWrapper>
        <div>Admin Content</div>
      </AdminWrapper>
    )

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('should show proper error icon and styling', () => {
    const { container } = renderWithRouter(
      <AdminWrapper>
        <div>Admin Content</div>
      </AdminWrapper>
    )

    expect(container.querySelector('.text-red-500')).toBeInTheDocument()
    expect(screen.getByText('🚫')).toBeInTheDocument()
  })
})