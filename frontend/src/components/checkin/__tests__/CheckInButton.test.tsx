import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckInButton } from '../CheckInButton'
import type { Cafe } from '../../../../../shared/types'
import * as useUserFeaturesModule from '../../../hooks/useUserFeatures'

// Mock the copy constants
vi.mock('../../../constants/copy', () => ({
  COPY: {
    checkin: {
      checkIn: 'Check In',
      checkedIn: 'Checked In',
    },
  },
}))

// Mock the CheckInModal component
vi.mock('../CheckInModal', () => ({
  CheckInModal: ({ isOpen, onClose, onSuccess }: any) => (
    isOpen ? (
      <div data-testid="check-in-modal">
        <button onClick={onSuccess} data-testid="mock-success">Success</button>
        <button onClick={onClose} data-testid="mock-close">Close</button>
      </div>
    ) : null
  ),
}))

// Mock user features hook
const { mockUseUserFeatures } = vi.hoisted(() => ({
  mockUseUserFeatures: vi.fn(() => ({
    isUserCheckinsEnabled: true,
  })),
}))

vi.mock('../../../hooks/useUserFeatures', () => ({
  useUserFeatures: mockUseUserFeatures,
}))

// Mock UI components
vi.mock('../../ui', () => ({
  PrimaryButton: ({ children, onClick, icon: Icon, className }: any) => (
    <button onClick={onClick} className={className} data-testid="primary-button">
      {Icon && <span data-testid="icon" />}
      {children}
    </button>
  ),
  SecondaryButton: ({ children, onClick, icon: Icon, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-testid="secondary-button">
      {Icon && <span data-testid="icon" />}
      {children}
    </button>
  ),
}))

// Mock icons
vi.mock('../../../components/icons', () => ({
  CheckCircle: () => <span data-testid="check-circle-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
}))

const mockCafe: Cafe = {
  id: 1,
  name: 'Test Cafe',
  address: '123 Test St',
  latitude: 43.6532,
  longitude: -79.3832,
  displayScore: 8.5,
  userRatingAvg: 4.2,
  userRatingCount: 15,
  hours: null,
  link: 'https://maps.google.com/test',
  neighborhood: 'Test Neighborhood',
  city: 'Toronto',
  review: 'Great matcha!',
  quickNote: 'Popular spot',
  ambianceScore: 9.0,
  chargeForAltMilk: 0.75,
  instagramHandle: 'testcafe',
  tiktokHandle: 'testcafe',
  drinks: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('CheckInButton', () => {
  const mockOnCheckInSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset useUserFeatures mock to default
    mockUseUserFeatures.mockReturnValue({ isUserCheckinsEnabled: true })
  })

  it('renders check-in button when not checked in', () => {
    render(
      <CheckInButton
        cafe={mockCafe}
        isCheckedIn={false}
        onCheckInSuccess={mockOnCheckInSuccess}
      />
    )

    expect(screen.getByTestId('primary-button')).toBeInTheDocument()
    expect(screen.getByText('Check In')).toBeInTheDocument()
  })

  it('renders checked-in button when already checked in', () => {
    render(
      <CheckInButton
        cafe={mockCafe}
        isCheckedIn={true}
        onCheckInSuccess={mockOnCheckInSuccess}
      />
    )

    expect(screen.getByTestId('secondary-button')).toBeInTheDocument()
    expect(screen.getByText('Checked In')).toBeInTheDocument()
    expect(screen.getByTestId('secondary-button')).toBeDisabled()
  })

  it('opens modal when check-in button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CheckInButton
        cafe={mockCafe}
        isCheckedIn={false}
        onCheckInSuccess={mockOnCheckInSuccess}
      />
    )

    await user.click(screen.getByTestId('primary-button'))
    expect(screen.getByTestId('check-in-modal')).toBeInTheDocument()
  })

  it('calls onCheckInSuccess when modal succeeds', async () => {
    const user = userEvent.setup()
    render(
      <CheckInButton
        cafe={mockCafe}
        isCheckedIn={false}
        onCheckInSuccess={mockOnCheckInSuccess}
      />
    )

    await user.click(screen.getByTestId('primary-button'))
    await user.click(screen.getByTestId('mock-success'))

    expect(mockOnCheckInSuccess).toHaveBeenCalledTimes(1)
  })

  it('does not render when user social features are disabled', () => {
    mockUseUserFeatures.mockReturnValue({ isUserCheckinsEnabled: false })

    const { container } = render(
      <CheckInButton
        cafe={mockCafe}
        isCheckedIn={false}
        onCheckInSuccess={mockOnCheckInSuccess}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })
})