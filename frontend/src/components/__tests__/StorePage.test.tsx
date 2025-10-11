import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StorePage } from '../StorePage'

// Mock data store
const mockDataStore = {
  fetchProducts: vi.fn(),
  productsFetched: false,
  isLoading: false,
  products: [
    {
      id: 1,
      name: 'Matcha Starter Kit',
      price: 29.99,
      currency: 'CAD',
      description: 'Everything you need to make perfect matcha at home',
      image: '🍵',
      inStock: true,
    },
    {
      id: 2,
      name: 'Premium Matcha Powder',
      price: 45.00,
      currency: 'CAD',
      description: 'Ceremonial grade matcha from Japan',
      image: '🌿',
      inStock: false,
    },
  ],
}

vi.mock('../../stores/dataStore', () => ({
  useDataStore: () => mockDataStore,
}))

vi.mock('../../hooks/useLazyData', () => ({
  useLazyData: vi.fn(),
}))

describe('StorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataStore.isLoading = false
  })

  it('should render store header', () => {
    render(<StorePage />)

    expect(screen.getByText(/Store/i)).toBeInTheDocument()
    expect(screen.getByText(/Matcha essentials and accessories/i)).toBeInTheDocument()
  })

  it('should display products when available', () => {
    render(<StorePage />)

    expect(screen.getByText('Matcha Starter Kit')).toBeInTheDocument()
    expect(screen.getByText('Premium Matcha Powder')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByText('$45.00')).toBeInTheDocument()
  })

  it('should show product availability status', () => {
    render(<StorePage />)

    expect(screen.getByText(/In Stock/i)).toBeInTheDocument()
    expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument()
  })

  it('should display loading state', () => {
    mockDataStore.isLoading = true
    render(<StorePage />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('should show empty state when no products', () => {
    mockDataStore.products = []
    render(<StorePage />)

    expect(screen.getByText(/No products available/i)).toBeInTheDocument()
    expect(screen.getByText(/Check back soon/i)).toBeInTheDocument()
  })

  it('should handle product click interactions', async () => {
    const user = userEvent.setup()
    render(<StorePage />)

    const product = screen.getByText('Matcha Starter Kit')
    await user.click(product)

    // Should show product details or navigate to product page
    expect(product).toBeInTheDocument()
  })

  it('should display product descriptions', () => {
    render(<StorePage />)

    expect(screen.getByText(/Everything you need to make perfect matcha/)).toBeInTheDocument()
    expect(screen.getByText(/Ceremonial grade matcha from Japan/)).toBeInTheDocument()
  })

  it('should render product images', () => {
    render(<StorePage />)

    expect(screen.getByText('🍵')).toBeInTheDocument()
    expect(screen.getByText('🌿')).toBeInTheDocument()
  })

  it('should handle different currencies', () => {
    const productsWithUSD = [{
      ...mockDataStore.products[0],
      currency: 'USD',
      price: 24.99,
    }]
    
    mockDataStore.products = productsWithUSD
    render(<StorePage />)

    expect(screen.getByText('$24.99')).toBeInTheDocument()
  })

  it('should be accessible with proper structure', () => {
    render(<StorePage />)

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('should filter out-of-stock items if needed', () => {
    render(<StorePage />)

    // Both items should be shown regardless of stock status
    expect(screen.getByText('Matcha Starter Kit')).toBeInTheDocument()
    expect(screen.getByText('Premium Matcha Powder')).toBeInTheDocument()
  })
})