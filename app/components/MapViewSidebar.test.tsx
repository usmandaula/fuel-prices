import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapViewSidebar from './MapViewSidebar';
import { MapViewSidebarProps } from '../types/gasStationTypes';

// Mock the ClickableStats component
jest.mock('./ClickableStats', () => {
  return function MockClickableStats(props: any) {
    return <div data-testid="clickable-stats">ClickableStats Component</div>;
  };
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaFilter: () => <div data-testid="filter-icon">Filter</div>,
  FaChevronRight: () => <div data-testid="chevron-right">Right</div>,
  FaChevronLeft: () => <div data-testid="chevron-left">Left</div>,
}));

describe('MapViewSidebar', () => {
  const mockSetSortBy = jest.fn();
  const mockSetSortDirection = jest.fn();
  const mockSetShowOnlyOpen = jest.fn();
  const mockSetPriceFilter = jest.fn();
  const mockOnPriceClick = jest.fn();
  const mockOnToggleSidebar = jest.fn();
  const mockOnRadiusChange = jest.fn();

  const defaultProps: MapViewSidebarProps = {
    sortBy: 'distance',
    setSortBy: mockSetSortBy,
    sortDirection: 'low_to_high' as const,
    setSortDirection: mockSetSortDirection,
    showOnlyOpen: false,
    setShowOnlyOpen: mockSetShowOnlyOpen,
    priceFilter: 'all',
    setPriceFilter: mockSetPriceFilter,
    openStationsCount: 5,
    sortedStationsLength: 10,
    averagePrice: '1.599',
    bestPrices: {
      diesel: { price: 1.549, stationId: '1', stationName: 'Station A' },
      e5: { price: 1.689, stationId: '2', stationName: 'Station B' },
      e10: { price: 1.639, stationId: '3', stationName: 'Station C' },
      overall: { price: 1.549, type: 'diesel', stationId: '1', stationName: 'Station A' },
    },
    selectedFuelType: 'all',
    onPriceClick: mockOnPriceClick,
    onToggleSidebar: mockOnToggleSidebar,
    isSidebarCollapsed: false,
    isDarkMode: false,
    viewMode: 'map',
    radius: 5,
    onRadiusChange: mockOnRadiusChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders map view sidebar with correct header', () => {
    render(<MapViewSidebar {...defaultProps} />);
    
    expect(screen.getByText('Map View')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('stations visible')).toBeInTheDocument();
  });

test('renders radius selector with correct active state', () => {
  render(<MapViewSidebar {...defaultProps} radius={5} />);
  
  // Find all buttons that contain "km"
  const kmButtons = screen.getAllByRole('button', { name: /km$/i });
  expect(kmButtons).toHaveLength(6); // 1, 3, 5, 10, 15, 25
  
  // The 5km button should be active
  const activeButton = screen.getByRole('button', { name: '5km' });
  expect(activeButton).toHaveClass('active');
});

test('calls onRadiusChange when radius button is clicked', () => {
  render(<MapViewSidebar {...defaultProps} />);
  
  // Find the 1km button and click it
  const oneKmButton = screen.getByRole('button', { name: '1km' });
  fireEvent.click(oneKmButton);
  
  expect(mockOnRadiusChange).toHaveBeenCalledWith(1);
});

  test('displays current radius', () => {
    render(<MapViewSidebar {...defaultProps} radius={10} />);
    
    expect(screen.getByText(/Current:/)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // The radius value
  });

  test('renders open now filter toggle', () => {
    render(<MapViewSidebar {...defaultProps} />);
    
    const filterButton = screen.getByText('Open Now (5)');
    expect(filterButton).toBeInTheDocument();
  });

  test('calls setShowOnlyOpen when filter toggle is clicked', () => {
    render(<MapViewSidebar {...defaultProps} />);
    
    const filterButton = screen.getByText('Open Now (5)');
    fireEvent.click(filterButton);
    
    expect(mockSetShowOnlyOpen).toHaveBeenCalledWith(true);
  });

  test('shows "Show All" when showOnlyOpen is true', () => {
    render(<MapViewSidebar {...defaultProps} showOnlyOpen={true} />);
    
    expect(screen.getByText('Show All (5)')).toBeInTheDocument();
  });

  test('renders ClickableStats component', () => {
    render(<MapViewSidebar {...defaultProps} />);
    
    expect(screen.getByTestId('clickable-stats')).toBeInTheDocument();
  });

  test('renders sidebar toggle button', () => {
  render(<MapViewSidebar {...defaultProps} />);
  
  // Now find by aria-label
  const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
  expect(toggleBtn).toBeInTheDocument();
  expect(toggleBtn).toContainElement(screen.getByTestId('chevron-left'));
});

  test('calls onToggleSidebar when toggle button is clicked', () => {
  render(<MapViewSidebar {...defaultProps} />);
  
  const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
  fireEvent.click(toggleBtn);
  
  expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
});

  test('applies collapsed class when isSidebarCollapsed is true', () => {
    const { container } = render(
      <MapViewSidebar {...defaultProps} isSidebarCollapsed={true} />
    );
    
    const sidebar = container.querySelector('.app-sidebar');
    expect(sidebar).toHaveClass('collapsed');
  });

test('shows chevron right when sidebar is collapsed', () => {
  render(<MapViewSidebar {...defaultProps} isSidebarCollapsed={true} />);
  
  // Check for the text "Right" from our mock
  expect(screen.getByText('Right')).toBeInTheDocument();
  
  // And check the aria-label changed
  const toggleBtn = screen.getByRole('button', { name: /expand sidebar/i });
  expect(toggleBtn).toBeInTheDocument();
});

  test('applies map-sidebar class', () => {
    const { container } = render(<MapViewSidebar {...defaultProps} />);
    
    const sidebar = container.querySelector('.app-sidebar');
    expect(sidebar).toHaveClass('map-sidebar');
  });

  test('does not crash when onRadiusChange is not provided', () => {
    const propsWithoutRadiusChange = { ...defaultProps, onRadiusChange: undefined };
    
    expect(() => {
      render(<MapViewSidebar {...propsWithoutRadiusChange} />);
    }).not.toThrow();
  });

  test('handles undefined radius gracefully', () => {
    const propsWithoutRadius = { ...defaultProps, radius: undefined };
    
    render(<MapViewSidebar {...propsWithoutRadius} />);
    
    // Should not crash and should still render other components
    expect(screen.getByText('Map View')).toBeInTheDocument();
  });
});