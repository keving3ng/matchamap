// Mock Leaflet for testing
export const mockLeaflet = {
  map: vi.fn(() => ({
    setView: vi.fn(),
    remove: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    on: vi.fn(),
  })),
  divIcon: vi.fn(),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: vi.fn(),
    },
  },
}

// Mock the leaflet module
vi.mock('leaflet', () => mockLeaflet)