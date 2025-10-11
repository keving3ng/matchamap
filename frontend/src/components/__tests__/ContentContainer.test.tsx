import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentContainer } from '../ContentContainer'

describe('ContentContainer', () => {
  it('should render children content', () => {
    render(
      <ContentContainer>
        <div>Test content</div>
      </ContentContainer>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should apply default max width when no maxWidth prop provided', () => {
    const { container } = render(
      <ContentContainer>
        <div>Content</div>
      </ContentContainer>
    )

    expect(container.firstChild).toHaveClass('max-w-lg')
  })

  it('should apply custom max width when maxWidth prop provided', () => {
    const { container } = render(
      <ContentContainer maxWidth="xl">
        <div>Content</div>
      </ContentContainer>
    )

    expect(container.firstChild).toHaveClass('max-w-xl')
  })

  it('should apply additional className when provided', () => {
    const { container } = render(
      <ContentContainer className="custom-class">
        <div>Content</div>
      </ContentContainer>
    )

    expect(container.firstChild).toHaveClass('custom-class')
    expect(container.firstChild).toHaveClass('mx-auto') // Default classes should still be present
  })

  it('should combine maxWidth and className props correctly', () => {
    const { container } = render(
      <ContentContainer maxWidth="2xl" className="p-4 bg-white">
        <div>Content</div>
      </ContentContainer>
    )

    expect(container.firstChild).toHaveClass('max-w-2xl')
    expect(container.firstChild).toHaveClass('p-4')
    expect(container.firstChild).toHaveClass('bg-white')
    expect(container.firstChild).toHaveClass('mx-auto')
  })

  it('should handle different maxWidth values', () => {
    const maxWidths = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']
    
    maxWidths.forEach(width => {
      const { container } = render(
        <ContentContainer maxWidth={width as any}>
          <div>Content</div>
        </ContentContainer>
      )
      
      expect(container.firstChild).toHaveClass(`max-w-${width}`)
    })
  })

  it('should maintain responsive behavior', () => {
    const { container } = render(
      <ContentContainer>
        <div>Responsive content</div>
      </ContentContainer>
    )

    expect(container.firstChild).toHaveClass('mx-auto')
    expect(container.firstChild).toHaveClass('max-w-lg')
  })

  it('should render as a div element', () => {
    const { container } = render(
      <ContentContainer>
        <div>Content</div>
      </ContentContainer>
    )

    expect(container.firstChild?.nodeName).toBe('DIV')
  })
})