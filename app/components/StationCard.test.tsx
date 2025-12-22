import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StationCard from './StationCard';
import { Station } from '../types/gasStationTypes';

// Mock the utils
jest.mock('../utils/gasStationUtils', () => ({
  getCheapestFuel: jest.fn().mockReturnValue({ 
    type: 'diesel', 
    price: 1.549 
  }),
  formatAddress: jest.fn().mockReturnValue('123 Main St, City'),
  getAmenityIcon: jest.fn().mockImplementation((amenity) => {
    const map: Record<string, string> = {
      'car_wash': 'car',
      'shop': 'shopping-cart',
      '24_7': 'gas-pump',
      'cafe': 'coffee',
      'atm': 'building'
    };
    return map[amenity] || 'home';
  }),
}));

// Mock formatUtils
jest.mock('../utils/formatUtils', () => ({
  formatPrice: jest.fn().mockImplementation((price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'N/A';
    }
    return price.toFixed(3);
  }),
  formatDistance: jest.fn().mockImplementation((dist) => {
    if (dist === null || dist === undefined || isNaN(dist)) {
      return '0.0';
    }
    return dist.toFixed(1);
  }),
}));

// Simple mock for react-icons
jest.mock('react-icons/fa', () => ({
  FaGasPump: () => <div data-testid="gas-pump-icon" />,
  FaMapMarkerAlt: () => <div data-testid="map-marker-icon" />,
  FaRuler: () => <div data-testid="ruler-icon" />,
  FaTrophy: () => <div data-testid="trophy-icon" />,
  FaCrown: () => <div data-testid="crown-icon" />,
  FaStar: () => <div data-testid="star-icon" />,
  FaRegStar: () => <div data-testid="reg-star-icon" />,
  FaCar: () => <div data-testid="car-icon" />,
  FaShoppingCart: () => <div data-testid="cart-icon" />,
  FaCoffee: () => <div data-testid="coffee-icon" />,
  FaBuilding: () => <div data-testid="building-icon" />,
  FaHome: () => <div data-testid="home-icon" />,
  FaRoute: () => <div data-testid="route-icon" />,
  FaChevronRight: () => <div data-testid="chevron-icon" />,
}));

describe('StationCard', () => {
  const mockOnSelect = jest.fn();
  const mockScrollToStation = jest.fn();

  const mockStation: Station = {
    id: '123',
    name: 'Test Station',
    brand: 'Shell',
    street: '123 Main St',
    houseNumber: '123',
    postCode: '12345',
    place: 'Test City',
    dist: 2.5,
    diesel: 1.549,
    e5: 1.689,
    e10: 1.639,
    isOpen: true,
    lat: 52.52,
    lng: 13.405,
    amenities: ['car_wash', 'shop', '24_7', 'cafe'],
    rating: 4.5,
    minPrice: 1.549,
    isOverallBestPrice: false,
    isBestForSelectedFuel: false,
  };

  const defaultProps = {
    station: mockStation,
    isSelected: false,
    onSelect: mockOnSelect,
    sortBy: 'distance' as const,
    isBestForSelectedFuel: false,
    isOverallBestPrice: false,
    selectedFuelType: 'all' as const,
    scrollToStation: mockScrollToStation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementations
    const { getCheapestFuel, formatAddress } = require('../utils/gasStationUtils');
    const { formatPrice, formatDistance } = require('../utils/formatUtils');
    
    (getCheapestFuel as jest.Mock).mockReturnValue({ 
      type: 'diesel', 
      price: 1.549 
    });
    (formatAddress as jest.Mock).mockReturnValue('123 Main St, City');
    (formatPrice as jest.Mock).mockImplementation((price) => {
      if (price === null || price === undefined || isNaN(price)) {
        return 'N/A';
      }
      return price.toFixed(3);
    });
    (formatDistance as jest.Mock).mockImplementation((dist) => {
      if (dist === null || dist === undefined || isNaN(dist)) {
        return '0.0';
      }
      return dist.toFixed(1);
    });
  });

  test('renders station card with basic information', () => {
    const { container } = render(<StationCard {...defaultProps} />);
    
    // Station name should be visible
    expect(screen.getByText('Test Station')).toBeInTheDocument();
    
    // Brand should be visible
    expect(screen.getByText('Shell')).toBeInTheDocument();
    
    // Check distance-value element directly
    const distanceValue = container.querySelector('.distance-value');
    expect(distanceValue).toBeInTheDocument();
    expect(distanceValue).toHaveTextContent('2.5');
    
    // Check that formatAddress was called
    const { formatAddress } = require('../utils/gasStationUtils');
    expect(formatAddress).toHaveBeenCalledWith(mockStation);
  });


  test('displays open status correctly', () => {
    render(<StationCard {...defaultProps} />);
    
    const statusBadge = screen.getByText('Open Now');
    expect(statusBadge).toHaveClass('open');
  });

  test('displays rating when available', () => {
    render(<StationCard {...defaultProps} />);
    
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  test('displays all fuel prices', () => {
    render(<StationCard {...defaultProps} />);
    
    expect(screen.getByText('Diesel')).toBeInTheDocument();
    expect(screen.getByText('E5')).toBeInTheDocument();
    expect(screen.getByText('E10')).toBeInTheDocument();
  });

  test('highlights cheapest fuel with trophy icon', () => {
    render(<StationCard {...defaultProps} />);
    
    // Diesel should be marked as cheapest
    const dieselElement = screen.getByText('Diesel').closest('.price-item');
    expect(dieselElement).toHaveClass('cheapest');
  });

  test('displays amenities when available', () => {
    render(<StationCard {...defaultProps} />);
    
    expect(screen.getByText('Facilities:')).toBeInTheDocument();
  });

  test('shows overall best price badge when applicable', () => {
    const bestStation = {
      ...mockStation,
      isOverallBestPrice: true,
      minPrice: 1.499,
    };
    
    render(
      <StationCard 
        {...defaultProps} 
        station={bestStation}
        isOverallBestPrice={true}
      />
    );
    
    expect(screen.getByText('Best Overall Price')).toBeInTheDocument();
  });

  test('shows best fuel price badge when applicable', () => {
    render(
      <StationCard 
        {...defaultProps} 
        selectedFuelType="diesel"
        isBestForSelectedFuel={true}
      />
    );
    
    expect(screen.getByText('Best DIESEL Price')).toBeInTheDocument();
  });

  test('calls onSelect and scrollToStation when card is clicked', () => {
    render(<StationCard {...defaultProps} />);
    
    const card = screen.getByText('Test Station').closest('.station-card')!;
    fireEvent.click(card);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockStation);
    expect(mockScrollToStation).toHaveBeenCalledWith('123');
  });

  test('applies selected class when isSelected is true', () => {
    render(<StationCard {...defaultProps} isSelected={true} />);
    
    const card = screen.getByText('Test Station').closest('.station-card');
    expect(card).toHaveClass('selected');
  });

  test('applies sorting indicator based on sortBy', () => {
    render(<StationCard {...defaultProps} sortBy="price_diesel" />);
    
    const dieselElement = screen.getByText('Diesel').closest('.price-item');
    expect(dieselElement).toHaveClass('sorting');
  });

  test('renders action buttons', () => {
    render(<StationCard {...defaultProps} />);
    
    expect(screen.getByText('Directions')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  test('handles station without amenities gracefully', () => {
    const stationWithoutAmenities = {
      ...mockStation,
      amenities: undefined,
    };
    
    render(<StationCard {...defaultProps} station={stationWithoutAmenities} />);
    
    expect(screen.queryByText('Facilities:')).not.toBeInTheDocument();
  });

  test('handles station without rating gracefully', () => {
    const stationWithoutRating = {
      ...mockStation,
      rating: undefined,
    };
    
    render(<StationCard {...defaultProps} station={stationWithoutRating} />);
    
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });

  // Add more specific tests for different cheapest fuel scenarios
  test('handles different cheapest fuel types', () => {
    const { getCheapestFuel } = require('../utils/gasStationUtils');
    
    // Test with E5 as cheapest
    (getCheapestFuel as jest.Mock).mockReturnValue({ 
      type: 'e5', 
      price: 1.589 
    });
    
    render(<StationCard {...defaultProps} />);
    
    const e5Element = screen.getByText('E5').closest('.price-item');
    expect(e5Element).toHaveClass('cheapest');
  });

  test('handles closed station', () => {
    const closedStation = { ...mockStation, isOpen: false };
    render(<StationCard {...defaultProps} station={closedStation} />);
    
    expect(screen.getByText('Closed')).toBeInTheDocument();
    const card = screen.getByText('Test Station').closest('.station-card');
    expect(card).toHaveClass('closed');
  });
});