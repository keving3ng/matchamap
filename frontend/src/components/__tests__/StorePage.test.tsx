import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StorePage } from '../StorePage'

// StorePage has hardcoded products, no dataStore mock needed

describe('StorePage', () => {

  it('should render store header', () => {
    render(<StorePage />)

    expect(screen.getByText('Shop')).toBeInTheDocument()
    expect(screen.getByText(/Matcha essentials and MatchaMap merch/i)).toBeInTheDocument()
  })

  it('should display products when available', () => {
    render(<StorePage />)

    // Check for actual products from the component
    expect(screen.getByText('MatchaMap T-Shirt')).toBeInTheDocument()
    expect(screen.getByText('Matcha Whisk Set')).toBeInTheDocument()
    expect(screen.getByText('$28')).toBeInTheDocument()
    expect(screen.getByText('$35')).toBeInTheDocument()
  })

  it('should show featured product badge', () => {
    render(<StorePage />)

    // MatchaMap T-Shirt is featured
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('should display product descriptions', () => {
    render(<StorePage />)

    expect(screen.getByText(/Premium cotton tee with our iconic matcha leaf logo/)).toBeInTheDocument()
    expect(screen.getByText(/Traditional bamboo whisk and scoop/)).toBeInTheDocument()
  })

  it('should render product images', () => {
    render(<StorePage />)

    // Check for emoji images
    expect(screen.getByText('👕')).toBeInTheDocument()
    expect(screen.getByText('🎋')).toBeInTheDocument()
    expect(screen.getByText('🥤')).toBeInTheDocument()
    expect(screen.getByText('🍵')).toBeInTheDocument()
  })

  it('should display all 6 products', () => {
    render(<StorePage />)

    expect(screen.getByText('MatchaMap T-Shirt')).toBeInTheDocument()
    expect(screen.getByText('Matcha Whisk Set')).toBeInTheDocument()
    expect(screen.getByText('Travel Mug')).toBeInTheDocument()
    expect(screen.getByText('Matcha Bowl (Chawan)')).toBeInTheDocument()
    expect(screen.getByText('Toronto Matcha Guide')).toBeInTheDocument()
    expect(screen.getByText('MatchaMap Sticker Pack')).toBeInTheDocument()
  })

  it('should display coming soon notice', () => {
    render(<StorePage />)

    expect(screen.getByText(/Store Coming Soon/)).toBeInTheDocument()
    expect(screen.getByText(/We're currently setting up our shop/)).toBeInTheDocument()
  })

  it('should display free shipping info', () => {
    render(<StorePage />)

    expect(screen.getByText('Free Shipping')).toBeInTheDocument()
    expect(screen.getByText(/On orders over \$50/)).toBeInTheDocument()
  })

  it('should display promotional banner', () => {
    render(<StorePage />)

    expect(screen.getByText('New Spring Collection')).toBeInTheDocument()
    expect(screen.getByText(/Fresh designs and essentials for matcha lovers/)).toBeInTheDocument()
  })

  it('should have add to cart buttons', () => {
    render(<StorePage />)

    // Should have 6 "Add" buttons (one for each product)
    const addButtons = screen.getAllByText('Add')
    expect(addButtons).toHaveLength(6)
  })

  it('should display return policy info', () => {
    render(<StorePage />)

    expect(screen.getByText('Easy Returns')).toBeInTheDocument()
    expect(screen.getByText(/30-day return policy/)).toBeInTheDocument()
  })
})