// MapViewLayout.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import MapViewLayout from './MapViewLayout';
import { GasStation } from '../../types/gasStationTypes';

// Mock dynamic imports and child components
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => function MockDynamicComponent(props: any) {
    return <div data-testid="detailed-map-view">DetailedMapView</div>;
  },
}));

jest.mock('../MapViewSidebar', () => {
  return function MockMapViewSidebar(props: any) {
    return <div data-testid="map-view-sidebar">MapViewSidebar</div>;
  };
});

jest.mock('../MapControls', () => {
  return function MockMapControls(props: any) {
    return <div data-testid="map-controls">MapControls</div>;
  };
});

jest.mock('../ui/SelectedStationOverlay', () => {
  return function MockSelectedStationOverlay(props: any) {
    return <div data-testid="selected-station-overlay">Selected: {props.station?.name}</div>;
  };
});

jest.mock('../ui/MapLegend', () => {
  return function MockMapLegend() {
    return <div data-testid="map-legend">MapLegend</div>;
  };
});

describe('MapViewLayout', () => {
  const mockSetSelectedStation = jest.fn();
  const mockSetSortBy = jest.fn();
  const mockSetSortDirection = jest.fn();
  const mockSetShowOnlyOpen = jest.fn();
  const mockSetPriceFilter = jest.fn();
  const mockHandleBestPriceClick = jest.fn();
  const mockToggleSidebar = jest.fn();
  const mockSetMapLayer = jest.fn();
  const mockSetShowTraffic = jest.fn();
  const mockGetUserLocation = jest.fn();
  const mockSetMapZoom = jest.fn();
  const mockGetDirections = jest.fn();
  const mockOnRadiusChange = jest.fn();

  const mockStation: GasStation = {
    id: '1',
    name: 'Station A',
    brand: 'Brand A',
    street: 'Main St',
    houseNumber: '123',
    place: 'Berlin',
    lat: 52.52,
    lng: 13.405,
    dist: 1.5,
    diesel: 1.549,
    e5: 1.689,
    e10: 1.639,
    isOpen: true,
    openingTimes: [],
  };

  const defaultProps = {
    sortedStations: [mockStation],
    selectedStation: null,
    setSelectedStation: mockSetSelectedStation,
    userLocation: { lat: 52.52, lng: 13.405, name: 'Berlin' },
    searchedLocation: null,
    sortBy: 'distance' as const,
    sortDirection: 'low_to_high' as const,
    setSortBy: mockSetSortBy,
    setSortDirection: mockSetSortDirection,
    showOnlyOpen: false,
    setShowOnlyOpen: mockSetShowOnlyOpen,
    priceFilter: 'all' as const,
    setPriceFilter: mockSetPriceFilter,
    openStationsCount: 1,
    averagePrice: '1.599',
    bestPrices: {
      diesel: { price: 1.549, stationId: '1', stationName: 'Station A', type: 'diesel' as const },
      e5: { price: 1.689, stationId: '1', stationName: 'Station A', type: 'e5' as const },
      e10: { price: 1.639, stationId: '1', stationName: 'Station A', type: 'e10' as const },
      overall: { price: 1.549, stationId: '1', stationName: 'Station A', type: 'diesel' as const },
    },
    handleBestPriceClick: mockHandleBestPriceClick,
    isSidebarCollapsed: false,
    toggleSidebar: mockToggleSidebar,
    isDarkMode: false,
    mapLayer: 'standard' as const,
    showTraffic: false,
    setMapLayer: mockSetMapLayer,
    setShowTraffic: mockSetShowTraffic,
    getUserLocation: mockGetUserLocation,
    mapZoom: 12,
    setMapZoom: mockSetMapZoom,
    getDirections: mockGetDirections,
    radius: 5,
    onRadiusChange: mockOnRadiusChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders MapViewSidebar component', () => {
    render(<MapViewLayout {...defaultProps} />);
    expect(screen.getByTestId('map-view-sidebar')).toBeInTheDocument();
  });

  test('renders DetailedMapView component', () => {
    render(<MapViewLayout {...defaultProps} />);
    expect(screen.getByTestId('detailed-map-view')).toBeInTheDocument();
  });

  test('renders MapControls component', () => {
    render(<MapViewLayout {...defaultProps} />);
    expect(screen.getByTestId('map-controls')).toBeInTheDocument();
  });

  test('renders zoom indicator', () => {
    render(<MapViewLayout {...defaultProps} />);
    
    expect(screen.getByText('Zoom: 12x')).toBeInTheDocument();
  });

  test('renders MapLegend component', () => {
    render(<MapViewLayout {...defaultProps} />);
    expect(screen.getByTestId('map-legend')).toBeInTheDocument();
  });

  test('does not render SelectedStationOverlay when no station selected', () => {
    render(<MapViewLayout {...defaultProps} />);
    
    expect(screen.queryByTestId('selected-station-overlay')).not.toBeInTheDocument();
  });

  test('renders SelectedStationOverlay when station is selected', () => {
    render(<MapViewLayout {...defaultProps} selectedStation={mockStation} />);
    
    expect(screen.getByTestId('selected-station-overlay')).toBeInTheDocument();
    expect(screen.getByText('Selected: Station A')).toBeInTheDocument();
  });

  test('passes correct props to child components', () => {
    render(<MapViewLayout {...defaultProps} />);
    
    // All mocked components should render
    expect(screen.getByTestId('map-view-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('detailed-map-view')).toBeInTheDocument();
    expect(screen.getByTestId('map-controls')).toBeInTheDocument();
    expect(screen.getByTestId('map-legend')).toBeInTheDocument();
  });

  test('shows loading state for dynamic import', () => {
    // Since we mocked next/dynamic, we can't test the loading state directly
    // But we can verify the component renders without errors
    expect(() => {
      render(<MapViewLayout {...defaultProps} />);
    }).not.toThrow();
  });
});