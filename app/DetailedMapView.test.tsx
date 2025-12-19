import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock ALL imports before importing DetailedMapView
jest.mock('react-leaflet', () => {
  const React = require('react');
  
  const MockComponent = (props: any) => {
    const testId = props['data-testid'] || 'mock-component';
    return React.createElement('div', { 
      'data-testid': testId,
      onClick: props.onClick,
    }, props.children);
  };
  
  const MapContainer = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'map-container', ...props });
  
  const TileLayer = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'tile-layer', ...props });
  
  const Marker = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'marker', ...props });
  
  const Popup = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'popup', ...props });
  
  const Circle = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'circle', ...props });
  
  const ZoomControl = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'zoom-control', ...props });
  
  const ScaleControl = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'scale-control', ...props });
  
  const BaseLayer = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'base-layer', ...props });
  
  const LayersControl = (props: any) => 
    React.createElement(MockComponent, { 'data-testid': 'layers-control', ...props });
  
  // Attach BaseLayer to LayersControl
  LayersControl.BaseLayer = BaseLayer;
  
  const useMap = () => ({
    setView: jest.fn(),
    flyTo: jest.fn(),
    getZoom: () => 13,
  });
  
  const useMapEvents = () => ({
    getZoom: () => 13,
  });
  
  return {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Circle,
    ZoomControl,
    ScaleControl,
    LayersControl,
    useMap,
    useMapEvents,
    __esModule: true,
  };
});

jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      mergeOptions: jest.fn(),
      prototype: {},
    },
  },
  divIcon: jest.fn(() => ({ options: {} })),
}));

jest.mock('leaflet/dist/leaflet.css', () => ({}));

jest.mock('./utils/formatUtils', () => ({
  formatPrice: jest.fn((price) => `€${price?.toFixed(3) || 'N/A'}`),
  formatDistance: jest.fn((dist) => `${dist?.toFixed(1) || 'N/A'} km`),
  getCheapestFuel: jest.fn(),
}));

// Now import the component AFTER mocks are set up
import DetailedMapView from './DetailedMapView';

describe('DetailedMapView - Simple Mock', () => {
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
      rating: 4.5,
      amenities: ['Car Wash'],
      isBestForSelectedFuel: true,
      isOverallBestPrice: true,
      minPrice: 1.529,
    },
  ];

  const defaultProps = {
    stations: mockStations,
    selectedStation: null,
    userLocation: { lat: 52.52, lng: 13.405, name: 'Current Location' },
    onStationSelect: jest.fn(),
    searchedLocation: null,
    mapLayer: 'standard' as const,
    showTraffic: false,
    onZoomChange: jest.fn(),
    priceFilter: 'all' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders map container', () => {
    render(<DetailedMapView {...defaultProps} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  test('renders tile layers (multiple)', () => {
    render(<DetailedMapView {...defaultProps} />);
    
    // Use getAllByTestId since there are multiple TileLayer components
    const tileLayers = screen.getAllByTestId('tile-layer');
    expect(tileLayers.length).toBe(3); // Should render 3 tile layers (standard, satellite, terrain)
    expect(tileLayers[0]).toBeInTheDocument();
  });

  test('renders markers', () => {
    render(<DetailedMapView {...defaultProps} />);
    
    // Should render markers for stations
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBeGreaterThan(0);
  });

  test('renders map controls', () => {
    render(<DetailedMapView {...defaultProps} />);
    
    expect(screen.getByTestId('zoom-control')).toBeInTheDocument();
    expect(screen.getByTestId('scale-control')).toBeInTheDocument();
    expect(screen.getByTestId('layers-control')).toBeInTheDocument();
  });

  test('renders base layers for different map types', () => {
    render(<DetailedMapView {...defaultProps} />);
    
    const baseLayers = screen.getAllByTestId('base-layer');
    expect(baseLayers.length).toBe(3); // Standard, Satellite, Terrain
  });

  test('renders user location marker', () => {
    render(<DetailedMapView {...defaultProps} />);
    
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBeGreaterThan(0);
  });

  test('renders custom controls', () => {
    render(<DetailedMapView {...defaultProps} />);
    
    // Check for custom control buttons
    expect(screen.getByTitle('Price Visualization')).toBeInTheDocument();
    expect(screen.getByTitle('Show Clusters')).toBeInTheDocument();
    expect(screen.getByTitle('Recenter Map')).toBeInTheDocument();
    expect(screen.getByTitle('Show All Stations')).toBeInTheDocument();
    expect(screen.getByTitle('Show Cheapest Overall')).toBeInTheDocument();
  });

  test('renders zoom level display', () => {
    render(<DetailedMapView {...defaultProps} />);
    
    expect(screen.getByText(/Zoom:/)).toBeInTheDocument();
    expect(screen.getByText(/1 stations/)).toBeInTheDocument();
  });

  test('handles different map layers', () => {
    const satelliteProps = {
      ...defaultProps,
      mapLayer: 'satellite' as const,
    };
    
    render(<DetailedMapView {...satelliteProps} />);
    
    // Should still render all controls
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('tile-layer').length).toBe(3);
  });
});