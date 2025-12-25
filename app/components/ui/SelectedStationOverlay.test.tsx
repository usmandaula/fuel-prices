// SelectedStationOverlay.test.tsx - Updated version
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectedStationOverlay from './SelectedStationOverlay';
import { GasStation } from '../types/gasStationTypes';

// Mock child components and icons
jest.mock('./PriceDisplay', () => {
  return function MockPriceDisplay(props: any) {
    return (
      <div data-testid="price-display" data-fuel-type={props.fuelType}>
        {props.fuelType}: €{props.price.toFixed(3)}
        {props.isBestPrice && ' (Best)'}
        {props.isOverallBest && ' (Overall Best)'}
      </div>
    );
  };
});

jest.mock('react-icons/fa', () => ({
  FaTimes: () => <div data-testid="times-icon">✕</div>,
  FaRoute: () => <div data-testid="route-icon">🗺️</div>,
}));

describe('SelectedStationOverlay', () => {
  const mockOnClose = jest.fn();
  const mockOnGetDirections = jest.fn();

  const mockStation: GasStation = {
    id: '1',
    name: 'Test Station',
    brand: 'Test Brand',
    street: 'Main St',
    houseNumber: '123',
    place: 'Test City',
    lat: 52.52,
    lng: 13.405,
    dist: 2.5,
    diesel: 1.549,
    e5: 1.689,
    e10: 1.639,
    isOpen: true,
    openingTimes: [],
    isBestForSelectedFuel: false,
    isOverallBestPrice: false,
    minPrice: 1.549,
  };

  const defaultProps = {
    station: mockStation,
    priceFilter: 'all' as const,
    onClose: mockOnClose,
    onGetDirections: mockOnGetDirections,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders station name in header', () => {
    render(<SelectedStationOverlay {...defaultProps} />);
    
    expect(screen.getByText('Test Station')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Station');
  });

  test('renders close button with icon', () => {
    render(<SelectedStationOverlay {...defaultProps} />);
    
    // Find the close button via the icon
    const timesIcon = screen.getByTestId('times-icon');
    const closeButton = timesIcon.closest('button');
    
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toContainElement(timesIcon);
    expect(closeButton).toHaveClass('close-overlay');
  });

  test('calls onClose when close button is clicked', () => {
    render(<SelectedStationOverlay {...defaultProps} />);
    
    // Find the close button via the icon
    const timesIcon = screen.getByTestId('times-icon');
    const closeButton = timesIcon.closest('button');
    
    fireEvent.click(closeButton!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('renders all three PriceDisplay components', () => {
    render(<SelectedStationOverlay {...defaultProps} />);
    
    const priceDisplays = screen.getAllByTestId('price-display');
    expect(priceDisplays).toHaveLength(3);
    
    expect(priceDisplays[0]).toHaveAttribute('data-fuel-type', 'Diesel');
    expect(priceDisplays[1]).toHaveAttribute('data-fuel-type', 'E5');
    expect(priceDisplays[2]).toHaveAttribute('data-fuel-type', 'E10');
  });

  test('renders get directions button', () => {
    render(<SelectedStationOverlay {...defaultProps} />);
    
    const directionsButton = screen.getByText(/Get Directions/);
    expect(directionsButton).toBeInTheDocument();
    expect(directionsButton).toHaveTextContent('Get Directions (2.5 km)');
    expect(directionsButton).toContainElement(screen.getByTestId('route-icon'));
    expect(directionsButton).toHaveClass('get-directions-btn');
  });

  test('calls onGetDirections when button is clicked', () => {
    render(<SelectedStationOverlay {...defaultProps} />);
    
    const directionsButton = screen.getByText(/Get Directions/);
    fireEvent.click(directionsButton);
    
    expect(mockOnGetDirections).toHaveBeenCalledTimes(1);
  });

  test('passes correct props to PriceDisplay when priceFilter is diesel', () => {
    const propsWithDieselFilter = { ...defaultProps, priceFilter: 'diesel' as const };
    
    render(<SelectedStationOverlay {...propsWithDieselFilter} />);
    
    const priceDisplays = screen.getAllByTestId('price-display');
    
    // Check Diesel price display
    expect(priceDisplays[0]).toHaveTextContent('Diesel: €1.549');
    
    // Since station.isBestForSelectedFuel is false, shouldn't show "(Best)"
    expect(priceDisplays[0]).not.toHaveTextContent('(Best)');
    expect(priceDisplays[0]).not.toHaveTextContent('(Overall Best)');
  });

  describe('PriceDisplay props based on station and filter', () => {
    test('when priceFilter is all and station has overall best price', () => {
      const stationWithOverallBest: GasStation = {
        ...mockStation,
        isBestForSelectedFuel: false,
        isOverallBestPrice: true,
        minPrice: 1.549, // Diesel price
      };
      
      render(
        <SelectedStationOverlay 
          {...defaultProps} 
          station={stationWithOverallBest}
        />
      );
      
      const priceDisplays = screen.getAllByTestId('price-display');
      
      // Diesel has minPrice, should show Overall Best
      expect(priceDisplays[0]).toHaveTextContent('(Overall Best)');
      expect(priceDisplays[0]).not.toHaveTextContent('(Best)');
      
      // E5 and E10 don't have minPrice
      expect(priceDisplays[1]).not.toHaveTextContent('(Overall Best)');
      expect(priceDisplays[2]).not.toHaveTextContent('(Overall Best)');
    });

    test('when priceFilter is diesel and station has best for selected fuel', () => {
      const stationWithBestDiesel: GasStation = {
        ...mockStation,
        isBestForSelectedFuel: true,
        isOverallBestPrice: false,
      };
      
      const propsWithDieselFilter = { 
        ...defaultProps, 
        station: stationWithBestDiesel,
        priceFilter: 'diesel' as const 
      };
      
      render(<SelectedStationOverlay {...propsWithDieselFilter} />);
      
      const priceDisplays = screen.getAllByTestId('price-display');
      
      // Diesel should show as Best
      expect(priceDisplays[0]).toHaveTextContent('(Best)');
      expect(priceDisplays[0]).not.toHaveTextContent('(Overall Best)');
      
      // E5 and E10 shouldn't show anything
      expect(priceDisplays[1]).not.toHaveTextContent('(Best)');
      expect(priceDisplays[1]).not.toHaveTextContent('(Overall Best)');
      expect(priceDisplays[2]).not.toHaveTextContent('(Best)');
      expect(priceDisplays[2]).not.toHaveTextContent('(Overall Best)');
    });

    test('when station has both best for selected fuel and overall best', () => {
      const stationWithBoth: GasStation = {
        ...mockStation,
        isBestForSelectedFuel: true,
        isOverallBestPrice: true,
        minPrice: 1.549, // Diesel price
      };
      
      // Test with priceFilter = 'all'
      render(
        <SelectedStationOverlay 
          {...defaultProps} 
          station={stationWithBoth}
        />
      );
      
      const priceDisplays = screen.getAllByTestId('price-display');
      
      // With priceFilter = 'all', Diesel shows Overall Best but not Best
      expect(priceDisplays[0]).toHaveTextContent('(Overall Best)');
      expect(priceDisplays[0]).not.toHaveTextContent('(Best)');
      
      // E5 and E10 show nothing
      expect(priceDisplays[1]).not.toHaveTextContent('(Best)');
      expect(priceDisplays[1]).not.toHaveTextContent('(Overall Best)');
      expect(priceDisplays[2]).not.toHaveTextContent('(Best)');
      expect(priceDisplays[2]).not.toHaveTextContent('(Overall Best)');
    });

    test('when minPrice is E5', () => {
      const stationWithE5Min: GasStation = {
        ...mockStation,
        e5: 1.500, // Lower than diesel (1.549)
        isOverallBestPrice: true,
        minPrice: 1.500,
      };
      
      render(
        <SelectedStationOverlay 
          {...defaultProps} 
          station={stationWithE5Min}
        />
      );
      
      const priceDisplays = screen.getAllByTestId('price-display');
      
      // E5 has minPrice, should show Overall Best
      expect(priceDisplays[1]).toHaveTextContent('(Overall Best)');
      
      // Diesel and E10 don't have minPrice
      expect(priceDisplays[0]).not.toHaveTextContent('(Overall Best)');
      expect(priceDisplays[2]).not.toHaveTextContent('(Overall Best)');
    });
  });

  test('formats distance correctly', () => {
    const stationWithDifferentDistance: GasStation = {
      ...mockStation,
      dist: 1.234,
    };
    
    render(
      <SelectedStationOverlay 
        {...defaultProps} 
        station={stationWithDifferentDistance}
      />
    );
    
    expect(screen.getByText('Get Directions (1.2 km)')).toBeInTheDocument();
  });

  test('has correct CSS classes', () => {
    const { container } = render(<SelectedStationOverlay {...defaultProps} />);
    
    expect(container.querySelector('.selected-overlay')).toBeInTheDocument();
    expect(container.querySelector('.overlay-header')).toBeInTheDocument();
    expect(container.querySelector('.overlay-content')).toBeInTheDocument();
    expect(container.querySelector('.overlay-prices')).toBeInTheDocument();
    expect(container.querySelector('.close-overlay')).toBeInTheDocument();
    expect(container.querySelector('.get-directions-btn')).toBeInTheDocument();
  });

  test('handles station with very small distance', () => {
    const stationWithSmallDistance: GasStation = {
      ...mockStation,
      dist: 0.1,
    };
    
    render(
      <SelectedStationOverlay 
        {...defaultProps} 
        station={stationWithSmallDistance}
      />
    );
    
    expect(screen.getByText('Get Directions (0.1 km)')).toBeInTheDocument();
  });

  test('handles station with very large distance', () => {
    const stationWithLargeDistance: GasStation = {
      ...mockStation,
      dist: 99.999,
    };
    
    render(
      <SelectedStationOverlay 
        {...defaultProps} 
        station={stationWithLargeDistance}
      />
    );
    
    expect(screen.getByText('Get Directions (100.0 km)')).toBeInTheDocument();
  });

  test('close button has correct styling class', () => {
    render(<SelectedStationOverlay {...defaultProps} />);
    
    const timesIcon = screen.getByTestId('times-icon');
    const closeButton = timesIcon.closest('button');
    
    expect(closeButton).toHaveClass('close-overlay');
  });

  test('directions button shows correct distance formatting for various values', () => {
    const testCases = [
      { dist: 0, expected: '0.0 km' },
      { dist: 0.01, expected: '0.0 km' },
      { dist: 0.1, expected: '0.1 km' },
      { dist: 1, expected: '1.0 km' },
      { dist: 1.234, expected: '1.2 km' },
      { dist: 9.999, expected: '10.0 km' },
      { dist: 10, expected: '10.0 km' },
      { dist: 99.999, expected: '100.0 km' },
    ];
    
    testCases.forEach(({ dist, expected }) => {
      const testStation = { ...mockStation, dist };
      
      // Clean up between test cases
      jest.clearAllMocks();
      
      const { unmount } = render(
        <SelectedStationOverlay 
          {...defaultProps} 
          station={testStation}
        />
      );
      
      expect(screen.getByText(new RegExp(`Get Directions \\(${expected}\\)`))).toBeInTheDocument();
      
      unmount();
    });
  });

  test('displays correct prices for all fuel types', () => {
    render(<SelectedStationOverlay {...defaultProps} />);
    
    const priceDisplays = screen.getAllByTestId('price-display');
    
    expect(priceDisplays[0]).toHaveTextContent('Diesel: €1.549');
    expect(priceDisplays[1]).toHaveTextContent('E5: €1.689');
    expect(priceDisplays[2]).toHaveTextContent('E10: €1.639');
  });
});