import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ListViewSidebar from './ListViewSidebar';
import { ListViewSidebarProps } from '../types/gasStationTypes';

// Mock the ClickableStats component
jest.mock('./ClickableStats', () => {
  return function MockClickableStats(props: any) {
    return <div data-testid="clickable-stats">ClickableStats Component</div>;
  };
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaRuler: () => <div data-testid="ruler-icon">Ruler</div>,
  FaMoneyBillWave: () => <div data-testid="money-icon">Money</div>,
  FaFilter: () => <div data-testid="filter-icon">Filter</div>,
  FaSortAmountDown: () => <div data-testid="sort-down-icon">Sort Down</div>,
  FaSortAmountUp: () => <div data-testid="sort-up-icon">Sort Up</div>,
  FaChevronRight: () => <div data-testid="chevron-right">Right</div>,
  FaChevronLeft: () => <div data-testid="chevron-left">Left</div>,
}));

describe('ListViewSidebar', () => {
  const mockSetSortBy = jest.fn();
  const mockSetSortDirection = jest.fn();
  const mockSetShowOnlyOpen = jest.fn();
  const mockSetPriceFilter = jest.fn();
  const mockOnPriceClick = jest.fn();
  const mockOnToggleSidebar = jest.fn();
  const mockOnRadiusChange = jest.fn();

  const defaultProps: ListViewSidebarProps = {
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
    viewMode: 'list',
    radius: 5,
    onRadiusChange: mockOnRadiusChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sidebar with correct header and station count', () => {
    render(<ListViewSidebar {...defaultProps} />);
    
    expect(screen.getByText('Filters & Sorting')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('stations')).toBeInTheDocument();
  });

  test('renders all sort options with correct active state', () => {
    render(<ListViewSidebar {...defaultProps} />);
    
    const sortOptions = ['distance', 'price_diesel', 'price_e5', 'price_e10'];
    
    sortOptions.forEach(option => {
      const button = screen.getByText(option.replace('_', ' '));
      expect(button).toBeInTheDocument();
    });

    // Distance should be active initially
    const distanceBtn = screen.getByText('distance');
    expect(distanceBtn.closest('button')).toHaveClass('active');
  });

  test('calls setSortBy when sort option is clicked', () => {
    render(<ListViewSidebar {...defaultProps} />);
    
    const e5Button = screen.getByText('price e5');
    fireEvent.click(e5Button);
    
    expect(mockSetSortBy).toHaveBeenCalledWith('price_e5');
  });

  test('renders filter toggle with open stations count', () => {
    render(<ListViewSidebar {...defaultProps} openStationsCount={5} />);
    
    const filterButton = screen.getByText('Open Now (5)');
    expect(filterButton).toBeInTheDocument();
  });

  test('calls setShowOnlyOpen when filter toggle is clicked', () => {
    render(<ListViewSidebar {...defaultProps} />);
    
    const filterButton = screen.getByText('Open Now (5)');
    fireEvent.click(filterButton);
    
    expect(mockSetShowOnlyOpen).toHaveBeenCalledWith(true);
  });

  test('renders all price filter buttons', () => {
    render(<ListViewSidebar {...defaultProps} />);
    
    const priceButtons = ['All', 'DIESEL', 'E5', 'E10'];
    
    priceButtons.forEach(text => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  test('applies active class to active price filter', () => {
    render(<ListViewSidebar {...defaultProps} priceFilter="diesel" />);
    
    const dieselButton = screen.getByText('DIESEL');
    expect(dieselButton.closest('button')).toHaveClass('active');
  });

  test('calls setPriceFilter when price button is clicked', () => {
    render(<ListViewSidebar {...defaultProps} />);
    
    const dieselButton = screen.getByText('DIESEL');
    fireEvent.click(dieselButton);
    
    expect(mockSetPriceFilter).toHaveBeenCalledWith('diesel');
  });

  test('renders sort direction buttons with correct active state', () => {
    render(<ListViewSidebar {...defaultProps} sortDirection="low_to_high" />);
    
    const lowToHighBtn = screen.getByText('Low to High');
    const highToLowBtn = screen.getByText('High to Low');
    
    expect(lowToHighBtn.closest('button')).toHaveClass('active');
    expect(highToLowBtn.closest('button')).not.toHaveClass('active');
  });

  test('calls setSortDirection when direction button is clicked', () => {
    render(<ListViewSidebar {...defaultProps} />);
    
    const highToLowBtn = screen.getByText('High to Low');
    fireEvent.click(highToLowBtn);
    
    expect(mockSetSortDirection).toHaveBeenCalledWith('high_to_low');
  });

  test('renders ClickableStats component', () => {
    render(<ListViewSidebar {...defaultProps} />);
    
    expect(screen.getByTestId('clickable-stats')).toBeInTheDocument();
  });

test('renders sidebar toggle button when onToggleSidebar is provided', () => {
  render(<ListViewSidebar {...defaultProps} />);
  
  const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
  expect(toggleBtn).toBeInTheDocument();
  expect(toggleBtn).toContainElement(screen.getByTestId('chevron-left'));
});

test('calls onToggleSidebar when toggle button is clicked', () => {
  render(<ListViewSidebar {...defaultProps} />);
  
  const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
  fireEvent.click(toggleBtn);
  
  expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
});


test('calls onToggleSidebar when toggle button is clicked', () => {
  render(<ListViewSidebar {...defaultProps} />);
  
  const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
  fireEvent.click(toggleBtn);
  
  expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
});

  test('applies collapsed class when isSidebarCollapsed is true', () => {
    const { container } = render(
      <ListViewSidebar {...defaultProps} isSidebarCollapsed={true} />
    );
    
    const sidebar = container.querySelector('.app-sidebar');
    expect(sidebar).toHaveClass('collapsed');
  });

  test('shows chevron right when sidebar is collapsed', () => {
  render(<ListViewSidebar {...defaultProps} isSidebarCollapsed={true} />);
  
  expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
  // And the aria-label should change too
  const toggleBtn = screen.getByRole('button', { name: /expand sidebar/i });
  expect(toggleBtn).toBeInTheDocument();
  });
});