import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClickableStats from './ClickableStats';
import { ClickableStatsProps } from '../types/gasStationTypes';

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaGasPump: () => <div data-testid="gas-pump-icon">Gas Pump</div>,
  FaMoneyBillWave: () => <div data-testid="money-icon">Money</div>,
  FaExternalLinkAlt: () => <div data-testid="external-icon">External</div>,
  FaCrown: () => <div data-testid="crown-icon">Crown</div>,
  FaTrophy: () => <div data-testid="trophy-icon">Trophy</div>,
  FaStore: () => <div data-testid="store-icon">Store</div>,
  FaMapMarkerAlt: () => <div data-testid="map-marker-icon">Map Marker</div>,
}));

describe('ClickableStats', () => {
  const mockOnPriceClick = jest.fn();

  const defaultProps: ClickableStatsProps = {
    bestPrices: {
      diesel: { price: 1.549, stationId: '1', stationName: 'Station A' },
      e5: { price: 1.689, stationId: '2', stationName: 'Station B' },
      e10: { price: 1.639, stationId: '3', stationName: 'Station C' },
      overall: { price: 1.549, type: 'diesel', stationId: '1', stationName: 'Station A' },
    },
    onPriceClick: mockOnPriceClick,
    openStationsCount: 5,
    sortedStationsLength: 10,
    averagePrice: '1.599',
    selectedFuelType: 'all',
    isMapView: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all stat items', () => {
    render(<ClickableStats {...defaultProps} />);
    
    expect(screen.getByText('Best Overall')).toBeInTheDocument();
    expect(screen.getByText('Best Diesel')).toBeInTheDocument();
    expect(screen.getByText('Best E5')).toBeInTheDocument();
    expect(screen.getByText('Best E10')).toBeInTheDocument();
    expect(screen.getByText('Stations')).toBeInTheDocument();
    expect(screen.getByText('Avg Price')).toBeInTheDocument();
  });

test('displays correct prices in each stat item', () => {
  const { container } = render(<ClickableStats {...defaultProps} />);
  
  // Get each stat item by its class
  const overallStat = container.querySelector('.stat-item.overall-best');
  const dieselStat = container.querySelector('.stat-item.diesel');
  const e5Stat = container.querySelector('.stat-item.e5');
  const e10Stat = container.querySelector('.stat-item.e10');
  const averageStat = container.querySelector('.stat-item.average');
  
  // Check each one has the correct price
  expect(overallStat).toHaveTextContent('€1.549');
  expect(dieselStat).toHaveTextContent('€1.549');
  expect(e5Stat).toHaveTextContent('€1.689');
  expect(e10Stat).toHaveTextContent('€1.639');
  expect(averageStat).toHaveTextContent('€1.599');
});

test('displays station names in correct stats', () => {
  const { container } = render(<ClickableStats {...defaultProps} />);
  
  // Check each stat item specifically
  const overallStat = container.querySelector('.stat-item.overall-best');
  const dieselStat = container.querySelector('.stat-item.diesel');
  const e5Stat = container.querySelector('.stat-item.e5');
  const e10Stat = container.querySelector('.stat-item.e10');
  
  // Overall Best shows Station A
  expect(overallStat).toHaveTextContent('Station A');
  
  // Diesel also shows Station A (same station has best diesel price)
  expect(dieselStat).toHaveTextContent('Station A');
  
  // E5 shows Station B
  expect(e5Stat).toHaveTextContent('Station B');
  
  // E10 shows Station C
  expect(e10Stat).toHaveTextContent('Station C');
});

  test('displays station counts', () => {
    render(<ClickableStats {...defaultProps} />);
    
    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(screen.getByText('Open/Total')).toBeInTheDocument();
  });

  test('calls onPriceClick with correct parameters when stat is clicked', () => {
    render(<ClickableStats {...defaultProps} />);
    
    const overallStat = screen.getByText('Best Overall').closest('.stat-item')!;
    fireEvent.click(overallStat);
    
    expect(mockOnPriceClick).toHaveBeenCalledWith('1', 'diesel');
    
    const dieselStat = screen.getByText('Best Diesel').closest('.stat-item')!;
    fireEvent.click(dieselStat);
    
    expect(mockOnPriceClick).toHaveBeenCalledWith('1', 'diesel');
    
    const e5Stat = screen.getByText('Best E5').closest('.stat-item')!;
    fireEvent.click(e5Stat);
    
    expect(mockOnPriceClick).toHaveBeenCalledWith('2', 'e5');
  });

  test('does not call onPriceClick when stat is disabled (no data)', () => {
    const propsWithoutBestPrices: ClickableStatsProps = {
      ...defaultProps,
      bestPrices: {
        diesel: null,
        e5: null,
        e10: null,
        overall: null,
      },
    };
    
    render(<ClickableStats {...propsWithoutBestPrices} />);
    
    const overallStat = screen.getByText('Best Overall').closest('.stat-item')!;
    fireEvent.click(overallStat);
    
    expect(mockOnPriceClick).not.toHaveBeenCalled();
  });

  test('displays N/A when prices are not available', () => {
    const propsWithoutBestPrices: ClickableStatsProps = {
      ...defaultProps,
      bestPrices: {
        diesel: null,
        e5: null,
        e10: null,
        overall: null,
      },
    };
    
    render(<ClickableStats {...propsWithoutBestPrices} />);
    
    expect(screen.getAllByText('N/A')).toHaveLength(4); // Overall, Diesel, E5, E10
  });

  test('applies selected class when fuel type matches selectedFuelType', () => {
    render(<ClickableStats {...defaultProps} selectedFuelType="diesel" />);
    
    const dieselStat = screen.getByText('Best Diesel').closest('.stat-item');
    expect(dieselStat).toHaveClass('selected');
    
    const e5Stat = screen.getByText('Best E5').closest('.stat-item');
    expect(e5Stat).not.toHaveClass('selected');
  });

  test('applies disabled class when best price is null', () => {
    const propsWithoutDiesel: ClickableStatsProps = {
      ...defaultProps,
      bestPrices: {
        ...defaultProps.bestPrices,
        diesel: null,
      },
    };
    
    render(<ClickableStats {...propsWithoutDiesel} />);
    
    const dieselStat = screen.getByText('Best Diesel').closest('.stat-item');
    expect(dieselStat).toHaveClass('disabled');
  });

  test('shows external link icon when best price is available', () => {
    render(<ClickableStats {...defaultProps} />);
    
    const externalIcons = screen.getAllByTestId('external-icon');
    expect(externalIcons).toHaveLength(4); // Overall, Diesel, E5, E10
  });

  test('does not show external link icon when best price is null', () => {
    const propsWithoutBestPrices: ClickableStatsProps = {
      ...defaultProps,
      bestPrices: {
        diesel: null,
        e5: null,
        e10: null,
        overall: null,
      },
    };
    
    render(<ClickableStats {...propsWithoutBestPrices} />);
    
    const externalIcons = screen.queryAllByTestId('external-icon');
    expect(externalIcons).toHaveLength(0);
  });

  test('handles NaN average price gracefully', () => {
    const propsWithInvalidAverage: ClickableStatsProps = {
      ...defaultProps,
      averagePrice: 'invalid',
    };
    
    render(<ClickableStats {...propsWithInvalidAverage} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  test('applies map-view class when isMapView is true', () => {
    const { container } = render(
      <ClickableStats {...defaultProps} isMapView={true} />
    );
    
    const statsContainer = container.querySelector('.clickable-stats');
    expect(statsContainer).toHaveClass('map-view');
  });

  test('applies list-view class when isMapView is false', () => {
    const { container } = render(
      <ClickableStats {...defaultProps} isMapView={false} />
    );
    
    const statsContainer = container.querySelector('.clickable-stats');
    expect(statsContainer).toHaveClass('list-view');
  });
});