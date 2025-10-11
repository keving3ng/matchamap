import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutPage } from '../AboutPage'

describe('AboutPage', () => {
  it('should render page header', () => {
    render(<AboutPage />)

    expect(screen.getByText('About MatchaMap')).toBeInTheDocument()
    expect(screen.getByText('Your guide to Toronto\'s best matcha')).toBeInTheDocument()
  })

  it('should render hero section', () => {
    render(<AboutPage />)

    expect(screen.getByText('Discover Toronto\'s Matcha Scene')).toBeInTheDocument()
    expect(screen.getByText(/Curated reviews and ratings to help you find/)).toBeInTheDocument()
    expect(screen.getByText('🍵')).toBeInTheDocument()
  })

  it('should render mission statement section', () => {
    render(<AboutPage />)

    expect(screen.getByText('Our Mission')).toBeInTheDocument()
    expect(screen.getByText(/MatchaMap was created out of a love for high-quality matcha/)).toBeInTheDocument()
    expect(screen.getByText(/Our goal is simple: to help you find your next favorite matcha spot/)).toBeInTheDocument()
  })

  it('should render rating system section with all rating levels', () => {
    render(<AboutPage />)

    expect(screen.getByText('Our Rating System')).toBeInTheDocument()
    
    // Rating levels
    expect(screen.getByText('9-10')).toBeInTheDocument()
    expect(screen.getByText('7-8')).toBeInTheDocument()
    expect(screen.getByText('5-6')).toBeInTheDocument()
    expect(screen.getByText('3-4')).toBeInTheDocument()

    // Rating descriptions
    expect(screen.getByText('Exceptional')).toBeInTheDocument()
    expect(screen.getByText('Great')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Fair')).toBeInTheDocument()
  })

  it('should render evaluation criteria section', () => {
    render(<AboutPage />)

    expect(screen.getByText('What We Evaluate')).toBeInTheDocument()
    expect(screen.getByText('Matcha Quality')).toBeInTheDocument()
    expect(screen.getByText('Preparation')).toBeInTheDocument()
    expect(screen.getByText('Taste & Balance')).toBeInTheDocument()
    expect(screen.getByText('Overall Experience')).toBeInTheDocument()
  })

  it('should render reviewer information', () => {
    render(<AboutPage />)

    expect(screen.getByText('About the Reviewer')).toBeInTheDocument()
    expect(screen.getByText(/Hi! I'm a Toronto-based matcha enthusiast/)).toBeInTheDocument()
    expect(screen.getByText(/All reviews are based on personal visits/)).toBeInTheDocument()
    expect(screen.getByText('👤')).toBeInTheDocument()
  })

  it('should render coverage area section', () => {
    render(<AboutPage />)

    expect(screen.getByText('Coverage Area')).toBeInTheDocument()
    expect(screen.getByText(/We currently focus on Toronto and the Greater Toronto Area/)).toBeInTheDocument()
    expect(screen.getByText(/Want to suggest a cafe?/)).toBeInTheDocument()
  })

  it('should render social media links', () => {
    render(<AboutPage />)

    expect(screen.getByText('Follow our matcha journey on social media!')).toBeInTheDocument()
    
    const instagramLink = screen.getByText('Instagram').closest('a')!
    const tiktokLink = screen.getByText('TikTok').closest('a')!

    expect(instagramLink).toHaveAttribute('href', 'https://www.instagram.com/vivisual.diary')
    expect(instagramLink).toHaveAttribute('target', '_blank')
    expect(tiktokLink).toHaveAttribute('href', 'https://www.tiktok.com/@vivisual.diary')
    expect(tiktokLink).toHaveAttribute('target', '_blank')
  })

  it('should have proper heading structure for accessibility', () => {
    render(<AboutPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'About MatchaMap' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Discover Toronto\'s Matcha Scene' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Our Mission' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Our Rating System' })).toBeInTheDocument()
  })

  it('should apply correct styling classes for visual hierarchy', () => {
    const { container } = render(<AboutPage />)

    expect(container.querySelector('.bg-gradient-to-br.from-matcha-500')).toBeInTheDocument()
    expect(container.querySelector('.space-y-6')).toBeInTheDocument()
    expect(container.querySelectorAll('.bg-white.rounded-2xl')).toHaveLength(5)
  })

  it('should be responsive with proper layout classes', () => {
    const { container } = render(<AboutPage />)

    expect(container.querySelector('.flex-1.overflow-y-auto')).toBeInTheDocument()
    expect(container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2')).toBeInTheDocument()
  })
})