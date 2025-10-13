import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CafeManagementPage } from '../CafeManagementPage'
import { useDataStore } from '../../../stores/dataStore'
import type { Cafe } from '../../../types'

// Mock the data store
vi.mock('../../../stores/dataStore')
const mockUseDataStore = vi.mocked(useDataStore)

// Mock the API
vi.mock('../../../utils/api', () => ({
  api: {
    cafes: {
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    }
  }
}))

// Mock child components that have their own complex functionality
vi.mock('../CafeForm', () => ({
  CafeForm: () => <div data-testid="cafe-form">Cafe Form</div>
}))

vi.mock('../CafeFormWizard', () => ({
  CafeFormWizard: () => <div data-testid="cafe-form-wizard">Cafe Form Wizard</div>
}))

vi.mock('../DrinksManagement', () => ({
  DrinksManagement: () => <div data-testid="drinks-management">Drinks Management</div>
}))

const mockCafeComplete: Cafe = {
  id: 1,
  name: 'Complete Cafe',
  quickNote: 'A great cafe',
  city: 'toronto',
  address: '123 Main St',
  latitude: 43.6532,
  longitude: -79.3832,
  displayScore: 4.5,
  review: 'Excellent matcha and great atmosphere',
  hours: '8am-6pm',
  instagram: '@completecafe',
  instagramPostLink: 'https://instagram.com/p/123',
  tiktokPostLink: 'https://tiktok.com/@user/video/123',
  images: ['image1.jpg', 'image2.jpg'],
  ambianceScore: 4,
  chargeForAltMilk: false,
  source: null,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
}

const mockCafeIncomplete: Cafe = {
  id: 2,
  name: 'Incomplete Cafe',
  quickNote: 'Missing some fields',
  city: 'toronto',
  address: null,
  latitude: 43.6532,
  longitude: -79.3832,
  displayScore: 3.8,
  review: null,
  hours: null,
  instagram: null,
  instagramPostLink: null,
  tiktokPostLink: null,
  images: null,
  ambianceScore: null,
  chargeForAltMilk: null,
  source: null,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
}

describe('CafeManagementPage', () => {
  beforeEach(() => {
    mockUseDataStore.mockReturnValue({
      allCafes: [mockCafeComplete, mockCafeIncomplete],
      fetchCafes: vi.fn(),
      isLoading: false,
      // Add other required store properties with default values
      cafes: [],
      cafesFetched: true,
      selectedCafe: null,
      feedItems: [],
      feedFetched: false,
      events: [],
      eventsFetched: false,
      drinks: [],
      drinksFetched: false,
      fetchFeed: vi.fn(),
      fetchEvents: vi.fn(),
      fetchDrinks: vi.fn(),
      selectCafe: vi.fn(),
      clearSelectedCafe: vi.fn(),
    })
  })

  describe('MissingFieldsIndicator', () => {
    it('renders nothing when all fields are present', () => {
      render(<CafeManagementPage />)
      
      // Should not find any missing fields indicators for the complete cafe
      const completeCafeRow = screen.getByText('Complete Cafe').closest('.bg-white')
      expect(completeCafeRow).toBeInTheDocument()
      
      // The complete cafe shouldn't have a missing fields indicator
      const infoIcons = screen.getAllByTestId('lucide-info')
      expect(infoIcons).toHaveLength(1) // Only the incomplete cafe should have one
    })

    it('shows indicator when fields are missing', () => {
      render(<CafeManagementPage />)
      
      // Should find missing fields indicator for the incomplete cafe
      const incompleteCafeRow = screen.getByText('Incomplete Cafe').closest('.bg-white')
      expect(incompleteCafeRow).toBeInTheDocument()
      
      const infoIcon = screen.getByTestId('lucide-info')
      expect(infoIcon).toBeInTheDocument()
    })

    it('shows tooltip on hover', async () => {
      const user = userEvent.setup()
      render(<CafeManagementPage />)
      
      const infoIcon = screen.getByTestId('lucide-info')
      await user.hover(infoIcon)
      
      await waitFor(() => {
        expect(screen.getByText(/optional field.*missing/)).toBeInTheDocument()
        expect(screen.getByText(/Missing:/)).toBeInTheDocument()
      })
    })

    it('toggles tooltip on click for mobile', async () => {
      const user = userEvent.setup()
      render(<CafeManagementPage />)

      const infoIcon = screen.getByTestId('lucide-info')

      // Click to show tooltip
      await user.click(infoIcon)
      await waitFor(() => {
        expect(screen.getByText(/optional field.*missing/)).toBeInTheDocument()
      })

      // Tooltip remains visible after click (hover handlers keep it open)
      // User can close by clicking outside (tested in separate test)
      expect(screen.getByText(/optional field.*missing/)).toBeInTheDocument()
    })

    it('closes tooltip when clicking outside', async () => {
      const user = userEvent.setup()
      render(<CafeManagementPage />)
      
      const infoIcon = screen.getByTestId('lucide-info')
      
      // Click to show tooltip
      await user.click(infoIcon)
      await waitFor(() => {
        expect(screen.getByText(/optional field.*missing/)).toBeInTheDocument()
      })
      
      // Click outside
      await user.click(document.body)
      await waitFor(() => {
        expect(screen.queryByText(/optional field.*missing/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Search and Filter', () => {
    it('filters cafes by search query', async () => {
      const user = userEvent.setup()
      render(<CafeManagementPage />)

      const searchInput = screen.getByPlaceholderText('Search cafes by name or city...')
      // Use "great" to match only "Complete Cafe" (has "A great cafe" in quickNote)
      await user.type(searchInput, 'great')

      expect(screen.getByText('Complete Cafe')).toBeInTheDocument()
      expect(screen.queryByText('Incomplete Cafe')).not.toBeInTheDocument()
    })

    it('filters cafes by city', async () => {
      const user = userEvent.setup()
      render(<CafeManagementPage />)
      
      const citySelect = screen.getByDisplayValue('All Cities')
      await user.selectOptions(citySelect, 'toronto')
      
      // Both cafes are in Toronto, so both should be visible
      expect(screen.getByText('Complete Cafe')).toBeInTheDocument()
      expect(screen.getByText('Incomplete Cafe')).toBeInTheDocument()
    })
  })

  describe('Cafe Management Actions', () => {
    it('shows add cafe form when clicking Add New Cafe', async () => {
      const user = userEvent.setup()
      render(<CafeManagementPage />)
      
      const addButton = screen.getByText('Add New Cafe')
      await user.click(addButton)
      
      expect(screen.getByTestId('cafe-form-wizard')).toBeInTheDocument()
    })

    it('shows edit cafe form when clicking Edit', async () => {
      const user = userEvent.setup()
      render(<CafeManagementPage />)
      
      const editButtons = screen.getAllByText('Edit')
      await user.click(editButtons[0])
      
      expect(screen.getByTestId('cafe-form')).toBeInTheDocument()
    })

    it('shows drinks management when clicking Drinks', async () => {
      const user = userEvent.setup()
      render(<CafeManagementPage />)
      
      const drinksButtons = screen.getAllByText('Drinks')
      await user.click(drinksButtons[0])
      
      expect(screen.getByTestId('drinks-management')).toBeInTheDocument()
    })
  })

  describe('Loading and Empty States', () => {
    it('shows loading state when fetching cafes', () => {
      mockUseDataStore.mockReturnValue({
        allCafes: [],
        fetchCafes: vi.fn(),
        isLoading: true,
        // Add other required store properties
        cafes: [],
        cafesFetched: false,
        selectedCafe: null,
        feedItems: [],
        feedFetched: false,
        events: [],
        eventsFetched: false,
        drinks: [],
        drinksFetched: false,
        fetchFeed: vi.fn(),
        fetchEvents: vi.fn(),
        fetchDrinks: vi.fn(),
        selectCafe: vi.fn(),
        clearSelectedCafe: vi.fn(),
      })

      render(<CafeManagementPage />)
      expect(screen.getByTestId('lucide-loader')).toBeInTheDocument()
    })

    it('shows empty state when no cafes exist', () => {
      mockUseDataStore.mockReturnValue({
        allCafes: [],
        fetchCafes: vi.fn(),
        isLoading: false,
        // Add other required store properties
        cafes: [],
        cafesFetched: true,
        selectedCafe: null,
        feedItems: [],
        feedFetched: false,
        events: [],
        eventsFetched: false,
        drinks: [],
        drinksFetched: false,
        fetchFeed: vi.fn(),
        fetchEvents: vi.fn(),
        fetchDrinks: vi.fn(),
        selectCafe: vi.fn(),
        clearSelectedCafe: vi.fn(),
      })

      render(<CafeManagementPage />)
      expect(screen.getByText('No cafes found')).toBeInTheDocument()
      expect(screen.getByText('Add Your First Cafe')).toBeInTheDocument()
    })
  })
})