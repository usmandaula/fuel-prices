// Updated ListViewLayout.test.tsx with fixes
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ListViewLayout from './ListViewLayout';
import { GasStation } from '../types/gasStationTypes';

// Mock child components
jest.mock('../ListViewSidebar', () => {
  return function MockListViewSidebar(props: any) {
    return <div data-testid="list-view-sidebar">ListViewSidebar</div>;
  };
});

jest.mock('../StationCard', () => {
  return function MockStationCard(props: any) {
    return (
      <div 
        data-testid="station-card"
        data-station-id={props.station.id}
        data-is-selected={props.isSelected}
      >
        StationCard: {props.station.name}
      </div>
    );
  };
});

jest.mock('../ui/RadiusSelector', () => {
  return function MockRadiusSelector(props: any) {
    return <div data-testid="radius-selector">Radius: {props.radius}km</div>;
  };
});

jest.mock('../ui/EmptyState', () => {
  return function MockEmptyState() {
    return <div data-testid="empty-state">No stations found</div>;
  };
});

// Mock icons
jest.mock('react-icons/fa', () => ({
  FaLocationArrow: () => <div data-testid="location-arrow">Location</div>,
  FaFilter: () => <div data-testid="filter-icon">Filter</div>,
  FaChevronRight: () => <div data-testid="chevron-right">Right</div>,
}));

describe('ListViewLayout', () => {
  const mockSetSelectedStation = jest.fn();
  const mockSetSortBy = jest.fn();
  const mockSetSortDirection = jest.fn();
  const mockSetShowOnlyOpen = jest.fn();
  const mockSetPriceFilter = jest.fn();
  const mockHandleBestPriceClick = jest.fn();
  const mockToggleSidebar = jest.fn();
  const mockGetUserLocation = jest.fn();
  const mockScrollToStation = jest.fn();
  const mockOnRadiusChange = jest.fn();

  const mockStations: GasStation[] = [
    {
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
      isBestForSelectedFuel: false,
      isOverallBestPrice: false,
    },
    {
      id: '2',
      name: 'Station B',
      brand: 'Brand B',
      street: 'Second St',
      houseNumber: '456',
      place: 'Berlin',
      lat: 52.53,
      lng: 13.415,
      dist: 2.5,
      diesel: 1.599,
      e5: 1.649,
      e10: 1.599,
      isOpen: false,
      openingTimes: [],
      isBestForSelectedFuel: true,
      isOverallBestPrice: false,
    },
  ];

  const defaultProps = {
    sortedStations: mockStations,
    selectedStation: null,
    setSelectedStation: mockSetSelectedStation,
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
      e5: { price: 1.689, stationId: '2', stationName: 'Station B', type: 'e5' as const },
      e10: { price: 1.639, stationId: '1', stationName: 'Station A', type: 'e10' as const },
      overall: { price: 1.549, stationId: '1', stationName: 'Station A', type: 'diesel' as const },
    },
    handleBestPriceClick: mockHandleBestPriceClick,
    isSidebarCollapsed: false,
    toggleSidebar: mockToggleSidebar,
    isDarkMode: false,
    isLocating: false,
    getUserLocation: mockGetUserLocation,
    scrollToStation: mockScrollToStation,
    radius: 5,
    onRadiusChange: mockOnRadiusChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders ListViewSidebar component', () => {
    render(<ListViewLayout {...defaultProps} />);
    expect(screen.getByTestId('list-view-sidebar')).toBeInTheDocument();
  });

  test('renders header with correct station count', () => {
    render(<ListViewLayout {...defaultProps} />);
    
    expect(screen.getByText('Gas Stations')).toBeInTheDocument();
    expect(screen.getByText('Total Stations • 2')).toBeInTheDocument();
    expect(screen.getByText('Open • 1')).toBeInTheDocument();
    expect(screen.getByText('Sorted by distance (Low to High)')).toBeInTheDocument();
  });

  test('shows sidebar toggle button when sidebar is collapsed', () => {
    render(<ListViewLayout {...defaultProps} isSidebarCollapsed={true} />);
    
    const toggleBtn = screen.getByText('Show Filters');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn.closest('button')).toHaveTextContent('Show Filters');
  });

  test('calls toggleSidebar when inline toggle button is clicked', () => {
    render(<ListViewLayout {...defaultProps} isSidebarCollapsed={true} />);
    
    const toggleBtn = screen.getByText('Show Filters').closest('button');
    fireEvent.click(toggleBtn!);
    
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  test('renders action buttons', () => {
    render(<ListViewLayout {...defaultProps} />);
    
    expect(screen.getByText('Refresh Location')).toBeInTheDocument();
    expect(screen.getByText('Show Open Only')).toBeInTheDocument();
  });

  test('calls getUserLocation when refresh button is clicked', () => {
    render(<ListViewLayout {...defaultProps} />);
    
    const refreshBtn = screen.getByText('Refresh Location').closest('button');
    fireEvent.click(refreshBtn!);
    
    expect(mockGetUserLocation).toHaveBeenCalledTimes(1);
  });

  test('calls setShowOnlyOpen when filter button is clicked', () => {
    render(<ListViewLayout {...defaultProps} />);
    
    const filterBtn = screen.getByText('Show Open Only').closest('button');
    fireEvent.click(filterBtn!);
    
    expect(mockSetShowOnlyOpen).toHaveBeenCalledWith(true);
  });

  test('shows "Show All" text when showOnlyOpen is true', () => {
    render(<ListViewLayout {...defaultProps} showOnlyOpen={true} />);
    
    expect(screen.getByText('Show All')).toBeInTheDocument();
  });

  test('renders RadiusSelector component', () => {
    render(<ListViewLayout {...defaultProps} />);
    
    expect(screen.getByTestId('radius-selector')).toBeInTheDocument();
    expect(screen.getByText('Radius: 5km')).toBeInTheDocument();
  });

  test('renders station cards when stations exist', () => {
    render(<ListViewLayout {...defaultProps} />);
    
    // Use getAllByTestId for multiple elements
    const stationCards = screen.getAllByTestId('station-card');
    expect(stationCards).toHaveLength(2);
    
    // Verify content
    stationCards.forEach((card, index) => {
      expect(card).toHaveTextContent(`StationCard: ${mockStations[index].name}`);
    });
  });

  test('passes correct props to StationCard', () => {
    render(<ListViewLayout {...defaultProps} selectedStation={mockStations[0]} />);
    
    const stationCards = screen.getAllByTestId('station-card');
    expect(stationCards).toHaveLength(2);
    
    // First station should be selected
    expect(stationCards[0]).toHaveAttribute('data-is-selected', 'true');
    expect(stationCards[0]).toHaveAttribute('data-station-id', '1');
    
    // Second station should not be selected
    expect(stationCards[1]).toHaveAttribute('data-is-selected', 'false');
    expect(stationCards[1]).toHaveAttribute('data-station-id', '2');
  });

  test('renders empty state when no stations', () => {
    render(<ListViewLayout {...defaultProps} sortedStations={[]} />);
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.queryAllByTestId('station-card')).toHaveLength(0);
  });

  test('shows "Updating..." text when isLocating is true', () => {
    render(<ListViewLayout {...defaultProps} isLocating={true} />);
    
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    const refreshBtn = screen.getByText('Updating...').closest('button');
    expect(refreshBtn).toBeDisabled();
  });
});