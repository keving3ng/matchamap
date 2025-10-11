import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CitySelector } from '../CitySelector'

// Mock props
const mockProps = {
  currentCity: 'toronto',
  onCityChange: vi.fn(),
  cities: [
    { id: 'toronto', name: 'Toronto', displayName: 'Toronto, ON' },
    { id: 'montreal', name: 'Montreal', displayName: 'Montreal, QC' },
    { id: 'vancouver', name: 'Vancouver', displayName: 'Vancouver, BC' },
  ],
}

describe('CitySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render current city', () => {
    render(<CitySelector {...mockProps} />)

    expect(screen.getByText('Toronto, ON')).toBeInTheDocument()
  })

  it('should show dropdown when clicked', async () => {
    const user = userEvent.setup()
    render(<CitySelector {...mockProps} />)

    const selector = screen.getByText('Toronto, ON')
    await user.click(selector)

    expect(screen.getByText('Montreal, QC')).toBeInTheDocument()
    expect(screen.getByText('Vancouver, BC')).toBeInTheDocument()
  })

  it('should handle city selection', async () => {
    const user = userEvent.setup()
    render(<CitySelector {...mockProps} />)

    const selector = screen.getByText('Toronto, ON')
    await user.click(selector)

    const montrealOption = screen.getByText('Montreal, QC')
    await user.click(montrealOption)

    expect(mockProps.onCityChange).toHaveBeenCalledWith('montreal')
  })

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(<CitySelector {...mockProps} />)

    const selector = screen.getByText('Toronto, ON')
    await user.click(selector)

    expect(screen.getByText('Montreal, QC')).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByText('Montreal, QC')).not.toBeInTheDocument()
  })

  it('should be accessible with proper ARIA attributes', () => {
    render(<CitySelector {...mockProps} />)

    const selector = screen.getByRole('button')
    expect(selector).toHaveAttribute('aria-expanded', 'false')
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<CitySelector {...mockProps} />)

    const selector = screen.getByRole('button')
    
    // Open with Enter
    await user.type(selector, '{Enter}')
    expect(screen.getByText('Montreal, QC')).toBeInTheDocument()

    // Navigate with arrows and select with Enter
    await user.type(selector, '{ArrowDown}{Enter}')
    expect(mockProps.onCityChange).toHaveBeenCalled()
  })
})