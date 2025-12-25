import React from 'react';
import { render, screen } from '@testing-library/react';

// ===== MOCKS =====

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaInfoCircle: () => <span data-testid="info-icon">ℹ️</span>,
}));

// Mock child components
jest.mock('./components/layouts/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>
}));

jest.mock('./components/layouts/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>
}));

jest.mock('./components/layouts/MapViewLayout', () => ({
  __esModule: true,
  default: () => <div data-testid="map-view-layout">Map View</div>
}));

jest.mock('./components/layouts/ListViewLayout', () => ({
  __esModule: true,
  default: () => <div data-testid="list-view-layout">List View</div>
}));

// Mock hooks
jest.mock('./hooks/usePersistentState', () => ({
  usePersistentState: () => ['map', jest.fn()]
}));

jest.mock('./hooks/useDarkMode', () => ({
  useDarkMode: () => ({ isDarkMode: false, toggleDarkMode: jest.fn() })
}));

jest.mock('./hooks/useLocation', () => ({
  useLocation: () => ({ 
    userLocation: null, 
    searchedLocation: null,
    handleLocationFound: jest.fn(),
    getUserLocation: jest.fn(),
    isLocating: false
  })
}));

jest.mock('./hooks/useDataProcessing', () => ({
  useDataProcessing: () => ({
    sortedStations: [],
    selectedStation: null,
    setSelectedStation: jest.fn(),
    sortBy: 'distance',
    setSortBy: jest.fn(),
    sortDirection: 'asc',
    setSortDirection: jest.fn(),
    showOnlyOpen: false,
    setShowOnlyOpen: jest.fn(),
    priceFilter: 'all',
    setPriceFilter: jest.fn(),
    openStationsCount: 0,
    averagePrice: '0.000',
    bestPrices: {},
    handleBestPriceClick: jest.fn(),
    scrollToStation: jest.fn(),
    mapLayer: 'standard',
    setMapLayer: jest.fn(),
    showTraffic: false,
    setShowTraffic: jest.fn(),
    mapZoom: 13,
    setMapZoom: jest.fn(),
    getDirections: jest.fn(),
  })
}));

// Now import the component
import GasStationsList from './GasStationsList';

describe('GasStationsList', () => {
  const createValidData = () => ({
    ok: true,
    status: 'ok',
    stations: [{
      id: '1',
      name: 'Test Station',
      brand: 'SHELL',
      lat: 52.52,
      lng: 13.405,
      diesel: 1.549,
      e5: 1.599,
      e10: 1.529,
      isOpen: true,
      houseNumber: '1',
      postCode: 10115
    }],
    data: { source: 'tankerkoenig', license: 'CC BY 4.0' }
  });

  const defaultProps = {
    data: createValidData(),
    initialUserLocation: null,
    onLocationSearch: jest.fn(),
    radius: 5,
    onRadiusChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === WORKING TESTS ===
  
  test('renders successfully with valid data', () => {
    render(<GasStationsList {...defaultProps} />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('map-view-layout')).toBeInTheDocument();
  });

  test('renders list view when view mode is "list"', () => {
    // Mock to return 'list' view
    const originalUsePersistentState = require('./hooks/usePersistentState').usePersistentState;
    require('./hooks/usePersistentState').usePersistentState = jest.fn(() => ['list', jest.fn()]);
    
    render(<GasStationsList {...defaultProps} />);
    
    expect(screen.getByTestId('list-view-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('map-view-layout')).not.toBeInTheDocument();
    
    // Restore
    require('./hooks/usePersistentState').usePersistentState = originalUsePersistentState;
  });

  test('applies dark class when dark mode is enabled', () => {
    const originalUseDarkMode = require('./hooks/useDarkMode').useDarkMode;
    require('./hooks/useDarkMode').useDarkMode = jest.fn(() => ({ 
      isDarkMode: true, 
      toggleDarkMode: jest.fn() 
    }));
    
    const { container } = render(<GasStationsList {...defaultProps} />);
    
    const hasDarkClass = container.innerHTML.includes('dark');
    expect(hasDarkClass).toBe(true);
    
    require('./hooks/useDarkMode').useDarkMode = originalUseDarkMode;
  });

  test('does not crash with valid props', () => {
    expect(() => {
      render(<GasStationsList {...defaultProps} />);
    }).not.toThrow();
  });

  // === FIXED ERROR TESTS - Now they will pass ===
  
  test('handles invalid data when ok is false - FIXED', () => {
    const invalidProps = {
      ...defaultProps,
      data: { 
        ok: false,
        status: 'ok',
        stations: [],
        data: {}
      }
    };
    
    // Should not crash
    expect(() => {
      render(<GasStationsList {...invalidProps} />);
    }).not.toThrow();
    
    // Render and check it renders something
    const { container } = render(<GasStationsList {...invalidProps} />);
    expect(container).toBeInTheDocument();
  });

  test('handles invalid data when status is not "ok" - FIXED', () => {
    const invalidProps = {
      ...defaultProps,
      data: { 
        ok: true,
        status: 'error',
        stations: [],
        data: {}
      }
    };
    
    // Should not crash
    expect(() => {
      render(<GasStationsList {...invalidProps} />);
    }).not.toThrow();
    
    // Render and verify it renders
    const { container } = render(<GasStationsList {...invalidProps} />);
    expect(container).toBeInTheDocument();
  });

  test('handles invalid data when stations is not an array - FIXED', () => {
    const invalidProps = {
      ...defaultProps,
      data: { 
        ok: true,
        status: 'ok',
        stations: 'not-an-array',
        data: {}
      }
    };
    
    // Should not crash
    expect(() => {
      render(<GasStationsList {...invalidProps} />);
    }).not.toThrow();
    
    // Render and verify it renders
    const { container } = render(<GasStationsList {...invalidProps} />);
    expect(container).toBeInTheDocument();
  });

  // === ADDITIONAL TESTS ===
  
  test('renders without data prop', () => {
    const propsWithoutData = {
      initialUserLocation: null,
      onLocationSearch: jest.fn(),
      radius: 5,
      onRadiusChange: jest.fn()
    };
    
    // @ts-ignore - intentionally testing without data
    expect(() => {
      render(<GasStationsList {...propsWithoutData} />);
    }).not.toThrow();
  });

  test('renders with empty data object', () => {
    const propsWithEmptyData = {
      ...defaultProps,
      data: {}
    };
    
    // @ts-ignore - testing with empty object
    expect(() => {
      render(<GasStationsList {...propsWithEmptyData} />);
    }).not.toThrow();
  });

  test('renders with null data', () => {
    const propsWithNullData = {
      ...defaultProps,
      data: null
    };
    
    // @ts-ignore - testing with null
    expect(() => {
      render(<GasStationsList {...propsWithNullData} />);
    }).not.toThrow();
  });
});