import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPage } from '../SettingsPage'

// Mock the feature toggle hook
vi.mock('../../hooks/useFeatureToggle', () => ({
  useFeatureToggle: () => false,
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render settings page header', () => {
    render(<SettingsPage />)

    expect(screen.getByText(/Settings/i)).toBeInTheDocument()
    expect(screen.getByText(/Manage your preferences and account/i)).toBeInTheDocument()
  })

  it('should display account section', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    expect(screen.getByText('Change Password')).toBeInTheDocument()
  })

  it('should display preferences section with toggles', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Location Services')).toBeInTheDocument()
  })

  it('should toggle notifications setting', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    // Find all toggle buttons
    const buttons = screen.getAllByRole('button')
    // The first toggle button should be notifications
    const toggleButtons = buttons.filter(btn => btn.className.includes('relative w-12 h-6'))
    expect(toggleButtons.length).toBeGreaterThan(0)

    const notificationsToggle = toggleButtons[0]

    // Should start with green background (enabled)
    expect(notificationsToggle.className).toMatch(/bg-green-500/)

    // Click to toggle
    await user.click(notificationsToggle)

    // Should now have gray background (disabled)
    expect(notificationsToggle.className).toMatch(/bg-gray-300/)
  })

  it('should display data and privacy section', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Data & Privacy')).toBeInTheDocument()
    expect(screen.getByText('Download Your Data')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('should display about section', () => {
    render(<SettingsPage />)

    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })

  it('should display danger zone with sign out and delete account', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Danger Zone')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.getByText('Delete Account')).toBeInTheDocument()
  })

  it('should have all main sections visible', () => {
    render(<SettingsPage />)

    // Verify all main sections are present
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Data & Privacy')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Danger Zone')).toBeInTheDocument()
  })
})
