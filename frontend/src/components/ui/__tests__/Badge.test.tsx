import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreBadge, DrinkScoreBadge, StatusBadge, FeatureBadge, NotificationBadge } from '../Badge'

describe('ScoreBadge', () => {
  it('formats score to one decimal', () => {
    const { rerender } = render(<ScoreBadge score={8.5} />)
    expect(screen.getByText('8.5')).toBeInTheDocument()

    rerender(<ScoreBadge score={7.67} />)
    expect(screen.getByText('7.7')).toBeInTheDocument()

    rerender(<ScoreBadge score={10} />)
    expect(screen.getByText('10.0')).toBeInTheDocument()
  })

  it('merges className', () => {
    render(<ScoreBadge score={8} className="custom" />)
    expect(screen.getByText('8.0')).toHaveClass('custom')
  })
})

describe('DrinkScoreBadge', () => {
  it('formats score like ScoreBadge', () => {
    render(<DrinkScoreBadge score={6.45} />)
    expect(screen.getByText('6.5')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('renders children', () => {
    render(<StatusBadge>Open</StatusBadge>)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('supports variants without asserting CSS', () => {
    const { rerender } = render(<StatusBadge variant="success">OK</StatusBadge>)
    expect(screen.getByText('OK')).toBeInTheDocument()
    rerender(<StatusBadge variant="error">Bad</StatusBadge>)
    expect(screen.getByText('Bad')).toBeInTheDocument()
  })
})

describe('FeatureBadge', () => {
  it('renders children', () => {
    render(<FeatureBadge>Featured</FeatureBadge>)
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })
})

describe('NotificationBadge', () => {
  it('shows dot when no count', () => {
    render(<NotificationBadge />)
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument()
  })

  it('shows numeric count when provided', () => {
    render(<NotificationBadge count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('merges className on dot', () => {
    render(<NotificationBadge className="custom-notification-class" />)
    expect(document.querySelector('.custom-notification-class')).toBeInTheDocument()
  })
})
