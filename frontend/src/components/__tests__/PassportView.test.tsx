import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PassportView } from '../PassportView'
import type { Cafe } from '../../types'

// Mock cafes data
const mockCafes: Cafe[] = [
  {
    id: 1,
    name: 'Test Cafe 1',
    slug: 'test-cafe-1',
    latitude: 43.6532,
    longitude: -79.3832,
    link: 'https://maps.google.com/?q=Test+Cafe+1',
    city: 'Toronto',
    displayScore: 8.5,
    quickNote: 'Great matcha',
  },
  {
    id: 2,
    name: 'Test Cafe 2',
    slug: 'test-cafe-2',
    latitude: 43.6632,
    longitude: -79.3932,
    link: 'https://maps.google.com/?q=Test+Cafe+2',
    city: 'Toronto',
    displayScore: 9.0,
    quickNote: 'Amazing atmosphere',
  },
  {
    id: 3,
    name: 'Test Cafe 3',
    slug: 'test-cafe-3',
    latitude: 43.6732,
    longitude: -79.4032,
    link: 'https://maps.google.com/?q=Test+Cafe+3',
    city: 'Toronto',
    displayScore: 7.5,
    quickNote: 'Cozy spot',
  },
]

describe('PassportView', () => {
  const mockOnToggleStamp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render passport header', () => {
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('Matcha Passport')).toBeInTheDocument()
    expect(screen.getByText('Track your matcha journey across Toronto')).toBeInTheDocument()
    expect(screen.getByText('🎫')).toBeInTheDocument()
  })

  it('should display correct progress with no visits', () => {
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('Your Progress')).toBeInTheDocument()
    expect(screen.getByText('0/3')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('Start exploring')).toBeInTheDocument()
  })

  it('should display correct progress with partial visits', () => {
    const visitedStamps = [1, 2]
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={visitedStamps}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('2 of 3 visited')).toBeInTheDocument()
  })

  it('should display correct progress with all visits', () => {
    const visitedStamps = [1, 2, 3]
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={visitedStamps}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('3/3')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('3 of 3 visited')).toBeInTheDocument()
  })

  it('should render all cafe cards in collection grid', () => {
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('Collection')).toBeInTheDocument()
    expect(screen.getByText('Test Cafe 1')).toBeInTheDocument()
    expect(screen.getByText('Test Cafe 2')).toBeInTheDocument()
    expect(screen.getByText('Test Cafe 3')).toBeInTheDocument()
  })

  it('should display cafe scores', () => {
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('8.5')).toBeInTheDocument()
    expect(screen.getByText('9.0')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
  })

  it('should show visited stamps with checkmarks', () => {
    const visitedStamps = [1, 3]
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={visitedStamps}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks).toHaveLength(2)
  })

  it('should handle stamp toggle click', async () => {
    const user = userEvent.setup()
    mockOnToggleStamp.mockResolvedValue(undefined)

    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    const cafeCard = screen.getByText('Test Cafe 1').closest('button')
    expect(cafeCard).toBeInTheDocument()

    await user.click(cafeCard!)
    expect(mockOnToggleStamp).toHaveBeenCalledWith(1)
  })

  it('should show loading state during stamp toggle', async () => {
    const user = userEvent.setup()
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    mockOnToggleStamp.mockReturnValue(promise)

    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    const cafeCard = screen.getByText('Test Cafe 1').closest('button')!
    await user.click(cafeCard)

    // Should show loading spinner
    expect(cafeCard).toHaveClass('animate-pulse')
    expect(cafeCard).toBeDisabled()
    
    // Resolve the promise
    resolvePromise!()
    await waitFor(() => {
      expect(cafeCard).not.toHaveClass('animate-pulse')
      expect(cafeCard).not.toBeDisabled()
    })
  })

  it('should apply different styles to visited vs unvisited cafes', () => {
    const visitedStamps = [1]
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={visitedStamps}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    const visitedCard = screen.getByText('Test Cafe 1').closest('button')!
    const unvisitedCard = screen.getByText('Test Cafe 2').closest('button')!

    // Visited card should have full opacity and scale
    expect(visitedCard).toHaveClass('scale-100')
    expect(visitedCard).not.toHaveClass('opacity-40')

    // Unvisited card should be grayed out and smaller
    expect(unvisitedCard).toHaveClass('opacity-40')
    expect(unvisitedCard).toHaveClass('grayscale')
    expect(unvisitedCard).toHaveClass('scale-95')
  })

  it('should show trending up icon for progress >= 50%', () => {
    const visitedStamps = [1, 2] // 67% progress
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={visitedStamps}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    // TrendingUp icon should be rendered (checking by the accompanying text)
    expect(screen.getByText('2 of 3 visited')).toBeInTheDocument()
  })

  it('should show matcha emoji for progress < 50%', () => {
    const visitedStamps = [1] // 33% progress
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={visitedStamps}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('Start exploring')).toBeInTheDocument()
  })

  it('should handle empty cafe list', () => {
    render(
      <PassportView
        cafes={[]}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('0/0')).toBeInTheDocument()
    expect(screen.getByText('Collection')).toBeInTheDocument()
    // Should not crash with empty list
  })

  it('should handle cafe without display score', () => {
    const cafeWithoutScore: Cafe = {
      id: 4,
      name: 'Cafe No Score',
      slug: 'cafe-no-score',
      latitude: 43.6832,
      longitude: -79.4132,
      link: 'https://maps.google.com/?q=Cafe+No+Score',
      city: 'Toronto',
      quickNote: 'No score yet',
    }

    render(
      <PassportView
        cafes={[cafeWithoutScore]}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('Cafe No Score')).toBeInTheDocument()
    // Should not display a score badge
    expect(screen.queryByText(/\d+\.\d+/)).not.toBeInTheDocument()
  })

  it('should calculate percentage correctly with rounding', () => {
    const largeCafeList = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      name: `Cafe ${i + 1}`,
      slug: `cafe-${i + 1}`,
      latitude: 43.6532 + i * 0.01,
      longitude: -79.3832 + i * 0.01,
      link: `https://maps.google.com/?q=Cafe+${i + 1}`,
      city: 'Toronto',
      quickNote: `Cafe ${i + 1}`,
    }))

    const visitedStamps = [1, 2] // 2/7 = 28.57... should round to 29%
    render(
      <PassportView
        cafes={largeCafeList}
        visitedStamps={visitedStamps}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    expect(screen.getByText('2/7')).toBeInTheDocument()
    expect(screen.getByText('29%')).toBeInTheDocument()
  })

  it('should be accessible with proper button roles', () => {
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    const cafeButtons = screen.getAllByRole('button')
    expect(cafeButtons).toHaveLength(3) // One for each cafe

    cafeButtons.forEach(button => {
      expect(button).toBeEnabled()
    })
  })

  it('should handle toggle stamp error gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockOnToggleStamp.mockRejectedValue(new Error('Network error'))

    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    const cafeCard = screen.getByText('Test Cafe 1').closest('button')!
    await user.click(cafeCard)

    await waitFor(() => {
      // Should remove loading state even after error
      expect(cafeCard).not.toHaveClass('animate-pulse')
      expect(cafeCard).not.toBeDisabled()
      // Should log the error
      expect(consoleSpy).toHaveBeenCalledWith('Error toggling stamp:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should maintain loading state isolation between cards', async () => {
    const user = userEvent.setup()
    let resolvePromise1: () => void
    const promise1 = new Promise<void>((resolve) => {
      resolvePromise1 = resolve
    })
    mockOnToggleStamp.mockReturnValue(promise1)

    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={[]}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    const cafe1Card = screen.getByText('Test Cafe 1').closest('button')!
    const cafe2Card = screen.getByText('Test Cafe 2').closest('button')!

    await user.click(cafe1Card)

    // Only the first card should be loading
    expect(cafe1Card).toHaveClass('animate-pulse')
    expect(cafe1Card).toBeDisabled()
    expect(cafe2Card).not.toHaveClass('animate-pulse')
    expect(cafe2Card).not.toBeDisabled()

    resolvePromise1!()
    await waitFor(() => {
      expect(cafe1Card).not.toHaveClass('animate-pulse')
    })
  })

  it('should show progress bar with correct width', () => {
    const visitedStamps = [1, 2] // 67% progress
    render(
      <PassportView
        cafes={mockCafes}
        visitedStamps={visitedStamps}
        onToggleStamp={mockOnToggleStamp}
      />
    )

    const progressBar = document.querySelector('.bg-white.h-full.rounded-full')
    expect(progressBar).toHaveStyle({ width: '67%' })
  })
})