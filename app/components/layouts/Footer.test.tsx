// Footer.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from './Footer';

// Mock icons
jest.mock('react-icons/fa', () => ({
  FaMapMarkerAlt: () => <div data-testid="map-marker">📍</div>,
  FaLocationArrow: () => <div data-testid="location-arrow">↻</div>,
}));

describe('Footer', () => {
  const mockGetUserLocation = jest.fn();

  const defaultProps = {
    userLocation: { lat: 52.52, lng: 13.405, name: 'Berlin, Germany' },
    isLocating: false,
    dataSource: 'Tankerkönig API',
    getUserLocation: mockGetUserLocation,
    gasStationData: { license: 'CC BY 4.0' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders footer with location information', () => {
    render(<Footer {...defaultProps} />);
    
    expect(screen.getByText('Berlin, Germany')).toBeInTheDocument();
    expect(screen.getByTestId('map-marker')).toBeInTheDocument();
  });

  test('shows "Locating..." when no user location name', () => {
    const propsWithoutLocationName = {
      ...defaultProps,
      userLocation: { lat: 52.52, lng: 13.405 },
    };
    
    render(<Footer {...propsWithoutLocationName} />);
    
    expect(screen.getByText('Locating...')).toBeInTheDocument();
  });

  test('shows locating indicator when isLocating is true', () => {
    render(<Footer {...defaultProps} isLocating={true} />);
    
    expect(screen.getByText('Locating...')).toBeInTheDocument();
    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  test('renders data source information', () => {
    render(<Footer {...defaultProps} />);
    
    expect(screen.getByText(/Data: Tankerkönig API/)).toBeInTheDocument();
    expect(screen.getByText(/Map: OpenStreetMap/)).toBeInTheDocument();
    expect(screen.getByText(/API: CC BY 4.0/)).toBeInTheDocument();
  });

  test('renders without gasStationData license', () => {
    const propsWithoutLicense = {
      ...defaultProps,
      gasStationData: undefined,
    };
    
    render(<Footer {...propsWithoutLicense} />);
    
    expect(screen.getByText(/API: Tankerkönig API/)).toBeInTheDocument();
  });

  test('renders refresh location button', () => {
    render(<Footer {...defaultProps} />);
    
    const refreshBtn = screen.getByText('Refresh Location');
    expect(refreshBtn).toBeInTheDocument();
    expect(refreshBtn.closest('button')).toBeEnabled();
  });

  test('calls getUserLocation when refresh button is clicked', () => {
    render(<Footer {...defaultProps} />);
    
    const refreshBtn = screen.getByText('Refresh Location').closest('button');
    fireEvent.click(refreshBtn!);
    
    expect(mockGetUserLocation).toHaveBeenCalledTimes(1);
  });

  test('disables refresh button when isLocating is true', () => {
    render(<Footer {...defaultProps} isLocating={true} />);
    
    const refreshBtn = screen.getByText('Updating...').closest('button');
    expect(refreshBtn).toBeDisabled();
  });

  test('shows pulse dot when locating', () => {
    render(<Footer {...defaultProps} isLocating={true} />);
    
    const pulseDot = document.querySelector('.pulse-dot');
    expect(pulseDot).toBeInTheDocument();
  });

  test('renders without user location', () => {
    const propsWithoutUserLocation = {
      ...defaultProps,
      userLocation: undefined,
    };
    
    render(<Footer {...propsWithoutUserLocation} />);
    
    expect(screen.getByText('Locating...')).toBeInTheDocument();
  });

  test('has correct footer structure with three sections', () => {
    const { container } = render(<Footer {...defaultProps} />);
    
    const footer = container.querySelector('.app-footer');
    expect(footer).toBeInTheDocument();
    
    const content = container.querySelector('.footer-content');
    expect(content).toBeInTheDocument();
    
    const leftSection = container.querySelector('.footer-left');
    const centerSection = container.querySelector('.footer-center');
    const rightSection = container.querySelector('.footer-right');
    
    expect(leftSection).toBeInTheDocument();
    expect(centerSection).toBeInTheDocument();
    expect(rightSection).toBeInTheDocument();
  });
});