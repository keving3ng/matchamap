import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPage } from '../SettingsPage'

// Mock auth store
const mockAuthStore = {
  user: { id: 1, email: 'test@example.com', username: 'testuser' },
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render settings page header', () => {
    render(<SettingsPage />)

    expect(screen.getByText(/Settings/i)).toBeInTheDocument()
  })

  it('should display user information', () => {
    render(<SettingsPage />)

    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('should handle profile updates', async () => {
    const user = userEvent.setup()
    mockAuthStore.updateProfile.mockResolvedValue({})

    render(<SettingsPage />)

    const usernameInput = screen.getByDisplayValue('testuser')
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newusername')

    const saveButton = screen.getByText(/Save Changes/i)
    await user.click(saveButton)

    expect(mockAuthStore.updateProfile).toHaveBeenCalledWith({
      username: 'newusername',
      email: 'test@example.com',
    })
  })

  it('should handle account deletion with confirmation', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockAuthStore.deleteAccount.mockResolvedValue({})

    render(<SettingsPage />)

    const deleteButton = screen.getByText(/Delete Account/i)
    await user.click(deleteButton)

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockAuthStore.deleteAccount).toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  it('should not delete account if user cancels confirmation', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<SettingsPage />)

    const deleteButton = screen.getByText(/Delete Account/i)
    await user.click(deleteButton)

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockAuthStore.deleteAccount).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  it('should show loading states during operations', async () => {
    const user = userEvent.setup()
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    mockAuthStore.updateProfile.mockReturnValue(promise)

    render(<SettingsPage />)

    const saveButton = screen.getByText(/Save Changes/i)
    await user.click(saveButton)

    expect(saveButton).toBeDisabled()

    resolvePromise!()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const emailInput = screen.getByDisplayValue('test@example.com')
    await user.clear(emailInput)
    await user.type(emailInput, 'invalid-email')

    const saveButton = screen.getByText(/Save Changes/i)
    await user.click(saveButton)

    expect(mockAuthStore.updateProfile).not.toHaveBeenCalled()
  })

  it('should handle settings sections', () => {
    render(<SettingsPage />)

    expect(screen.getByText(/Profile Information/i)).toBeInTheDocument()
    expect(screen.getByText(/Account/i)).toBeInTheDocument()
    expect(screen.getByText(/Privacy/i)).toBeInTheDocument()
  })
})