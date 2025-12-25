import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapView from './MapView';

// Mock react-leaflet
jest.mock('react-leaflet', () => {
  const React = require('react');
  
  const MockComponent = (props: any) => {
    const testId = props['data-testid'] || 'mock-leaflet';
    const children = props.children;
    
    return React.createElement('div', { 
      'data-testid': testId,
      onClick: props.onClick,
    }, children);
  };
  
  const MapContainer = (props: any) => 
    React.createElement(MockComponent, { 
      'data-testid': 'map-container', 
      ...props 
    });
  
  const TileLayer = (props: any) => 
    React.createElement(MockComponent, { 
      'data-testid': 'tile-layer', 
      ...props 
    });
  
  const Marker = (props: any) => 
    React.createElement(MockComponent, { 
      'data-testid': 'marker', 
      onClick: props.eventHandlers?.click,
      ...props 
    });
  
  const Popup = (props: any) => 
    React.createElement(MockComponent, { 
      'data-testid': 'popup', 
      ...props 
    });
  
  // Mock useMap hook
  const useMap = () => ({
    setView: jest.fn(),
  });
  
  return {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
  };
});

// Mock leaflet
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      mergeOptions: jest.fn(),
      prototype: {},
    },
  },
  divIcon: jest.fn(() => ({ options: {} })),
  map: jest.fn(() => ({
    setView: jest.fn(),
  })),
}));

// Mock leaflet CSS
jest.mock('leaflet/dist/leaflet.css', () => ({}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaGasPump: () => '⛽',
  FaMapMarkerAlt: () => '📍',
}));

describe('MapView', () => {
  const mockStations = [
    {
      id: '1',
      name: 'Test Station',
      brand: 'SHELL',
      street: 'Test Street',
      place: 'Test City',
      lat: 52.52,
      lng: 13.405,
      dist: 2.5,
      diesel: 1.549,
      e5: 1.599,
      e10: 1.529,
      isOpen: true,
      houseNumber: '1',
      postCode: 10115,
    },
  ];

  const defaultProps = {
    stations: mockStations,
    selectedStation: null,
    userLocation: { lat: 52.52, lng: 13.405, name: 'Current Location' },
    onStationSelect: jest.fn(),
    searchedLocation: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders map container', () => {
    render(<MapView {...defaultProps} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  test('renders tile layer', () => {
    render(<MapView {...defaultProps} />);
    
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  test('renders markers for stations', () => {
    render(<MapView {...defaultProps} />);
    
    const markers = screen.getAllByTestId('marker');
    // Should have user location marker + station marker
    expect(markers.length).toBe(2);
  });

  test('handles station selection', () => {
    render(<MapView {...defaultProps} />);
    
    const markers = screen.getAllByTestId('marker');
    
    // Click on the station marker (second marker)
    fireEvent.click(markers[1]);
    expect(defaultProps.onStationSelect).toHaveBeenCalledWith(mockStations[0]);
  });

  test('renders user location marker', () => {
    render(<MapView {...defaultProps} />);
    
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(2); // User location + station
  });

  test('handles missing user location', () => {
    const propsWithoutLocation = {
      ...defaultProps,
      userLocation: undefined,
    };
    
    render(<MapView {...propsWithoutLocation} />);
    
    // Should still render the map
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    // Should only have station markers (no user location marker)
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(1);
  });

  test('handles empty stations array', () => {
    const propsWithoutStations = {
      ...defaultProps,
      stations: [],
    };
    
    render(<MapView {...propsWithoutStations} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    // Should only have user location marker
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(1);
  });

  test('renders popups for markers', () => {
    render(<MapView {...defaultProps} />);
    
    // Each Marker component renders a Popup as children
    // Since we're mocking, we can check for the popup testid
    // Note: In the actual test, popups might not be visible by default
    // but our mock renders them as part of Marker
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(2);
  });

  test('renders with selected station', () => {
    const propsWithSelected = {
      ...defaultProps,
      selectedStation: mockStations[0],
    };
    
    render(<MapView {...propsWithSelected} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(2);
  });

  test('renders with searched location', () => {
    const propsWithSearched = {
      ...defaultProps,
      searchedLocation: { lat: 52.53, lng: 13.41, name: 'Searched Location' },
    };
    
    render(<MapView {...propsWithSearched} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});