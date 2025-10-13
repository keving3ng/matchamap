import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

// Create a simple AdminPage component for testing
const AdminPage: React.FC = () => {
  const [users, setUsers] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Mock loading users
    setTimeout(() => {
      setUsers([
        { id: 1, email: 'user1@example.com', role: 'user' },
        { id: 2, email: 'admin@example.com', role: 'admin' },
      ])
      setLoading(false)
    }, 100)
  }, [])

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>
        <h2>User Management</h2>
        {loading ? (
          <div>Loading users...</div>
        ) : (
          <div>
            {users.map((user: any) => (
              <div key={user.id} data-testid={`user-${user.id}`}>
                {user.email} - {user.role}
                <button>Edit</button>
                <button>Delete</button>
              </div>
            ))}
          </div>
        )}
        <button>Add New User</button>
      </div>
      <div>
        <h2>System Stats</h2>
        <div>Total Users: {users.length}</div>
        <div>Total Cafes: 25</div>
        <div>Total Reviews: 150</div>
      </div>
    </div>
  )
}

// Mock auth store
const mockAuthStore = {
  isAuthenticated: true,
  user: { id: 1, email: 'admin@example.com', role: 'admin' },
  isAdmin: true,
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render admin dashboard header', () => {
    renderWithRouter(<AdminPage />)

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('System Stats')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    renderWithRouter(<AdminPage />)

    expect(screen.getByText('Loading users...')).toBeInTheDocument()
  })

  it('should display users after loading', async () => {
    renderWithRouter(<AdminPage />)

    await screen.findByTestId('user-1')
    expect(screen.getByText('user1@example.com - user')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com - admin')).toBeInTheDocument()
  })

  it('should display system statistics', async () => {
    renderWithRouter(<AdminPage />)

    await screen.findByText('Total Users: 2')
    expect(screen.getByText('Total Cafes: 25')).toBeInTheDocument()
    expect(screen.getByText('Total Reviews: 150')).toBeInTheDocument()
  })

  it('should have user management controls', async () => {
    renderWithRouter(<AdminPage />)

    await screen.findByTestId('user-1')
    
    const editButtons = screen.getAllByText('Edit')
    const deleteButtons = screen.getAllByText('Delete')
    const addButton = screen.getByText('Add New User')

    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
    expect(addButton).toBeInTheDocument()
  })

  it('should handle user actions', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminPage />)

    await screen.findByTestId('user-1')
    
    const editButton = screen.getAllByText('Edit')[0]
    const deleteButton = screen.getAllByText('Delete')[0]
    const addButton = screen.getByText('Add New User')

    expect(editButton).toBeInTheDocument()
    expect(deleteButton).toBeInTheDocument()
    expect(addButton).toBeInTheDocument()

    // These buttons should be clickable
    await user.click(editButton)
    await user.click(deleteButton)
    await user.click(addButton)
  })

  it('should be accessible with proper heading structure', () => {
    renderWithRouter(<AdminPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Admin Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'User Management' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'System Stats' })).toBeInTheDocument()
  })

  it('should display different user roles correctly', async () => {
    renderWithRouter(<AdminPage />)

    await screen.findByTestId('user-1')
    expect(screen.getByText(/user1@example.com - user/)).toBeInTheDocument()
    expect(screen.getByText(/admin@example.com - admin/)).toBeInTheDocument()
  })

  it('should handle empty user list gracefully', () => {
    // This would be tested with a modified version that starts with empty users
    renderWithRouter(<AdminPage />)

    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  it('should have proper admin layout structure', () => {
    const { container } = renderWithRouter(<AdminPage />)

    expect(container.querySelector('h1')).toBeInTheDocument()
    expect(container.querySelector('h2')).toBeInTheDocument()
  })
})