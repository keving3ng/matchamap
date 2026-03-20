import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, CafeCardSkeleton, ListSkeleton, DetailPageSkeleton } from '../Skeleton'

describe('Skeleton', () => {
  it('renders base skeleton', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('.bg-gray-200')).toBeInTheDocument()
  })

  it('applies width, height, and animation modes', () => {
    const { rerender } = render(<Skeleton width={200} height="75px" />)
    let el = document.querySelector('.bg-gray-200')
    expect(el).toHaveStyle({ width: '200px', height: '75px' })

    rerender(<Skeleton animation="pulse" />)
    el = document.querySelector('.animate-pulse')
    expect(el).toBeInTheDocument()

    rerender(<Skeleton animation="none" />)
    el = document.querySelector('.bg-gray-200')
    expect(el).not.toHaveClass('animate-pulse')
  })

  it('merges className', () => {
    render(<Skeleton className="custom-skeleton-class" />)
    expect(document.querySelector('.custom-skeleton-class')).toBeInTheDocument()
  })
})

describe('CafeCardSkeleton', () => {
  it('renders layout with multiple placeholders', () => {
    render(<CafeCardSkeleton />)
    expect(document.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(2)
  })
})

describe('ListSkeleton', () => {
  it('renders requested card count', () => {
    const { rerender } = render(<ListSkeleton />)
    expect(document.querySelectorAll('.bg-white.rounded-2xl').length).toBe(5)

    rerender(<ListSkeleton count={3} />)
    expect(document.querySelectorAll('.bg-white.rounded-2xl').length).toBe(3)

    rerender(<ListSkeleton count={0} />)
    expect(document.querySelectorAll('.bg-white.rounded-2xl').length).toBe(0)
  })
})

describe('DetailPageSkeleton', () => {
  it('renders a scrollable detail placeholder tree', () => {
    render(<DetailPageSkeleton />)
    expect(document.querySelector('.flex-1.overflow-y-auto')).toBeInTheDocument()
  })
})
