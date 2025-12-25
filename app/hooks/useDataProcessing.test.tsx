import { renderHook, act } from '@testing-library/react';
import { useDataProcessing } from './useDataProcessing';

const mockStations = [
  {
    id: '1',
    name: 'Station A',
    brand: 'SHELL',
    street: 'Street A',
    place: 'City A',
    lat: 52.52,
    lng: 13.405,
    diesel: 1.549,
    e5: 1.599,
    e10: 1.529,
    isOpen: true,
    houseNumber: '1',
    postCode: 10115,
  },
  {
    id: '2',
    name: 'Station B',
    brand: 'ARAL',
    street: 'Street B',
    place: 'City B',
    lat: 52.53,
    lng: 13.415,
    diesel: 1.569,
    e5: 1.609,
    e10: 1.549,
    isOpen: false,
    houseNumber: '2',
    postCode: 10115,
  },
];

const mockData = {
  stations: mockStations,
};

const mockUserLocation = {
  lat: 52.52,
  lng: 13.405,
  name: 'Current Location',
};

describe('useDataProcessing', () => {
  it('calculates distances when user location is provided', () => {
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'map')
    );

    expect(result.current.sortedStations).toHaveLength(2);
    expect(result.current.sortedStations[0]).toHaveProperty('dist');
    expect(typeof result.current.sortedStations[0].dist).toBe('number');
  });

  it('filters open stations', () => {
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'map')
    );

    act(() => {
      result.current.setShowOnlyOpen(true);
    });

    expect(result.current.openStationsCount).toBe(1);
    expect(result.current.filteredStations).toHaveLength(1);
    expect(result.current.filteredStations[0].isOpen).toBe(true);
  });

  it('sorts stations by distance', () => {
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'map')
    );

    act(() => {
      result.current.setSortBy('distance');
    });

    // Station A should be closer to user location
    expect(result.current.sortedStations[0].name).toBe('Station A');
    expect(result.current.sortedStations[1].name).toBe('Station B');
  });

  it('sorts stations by price', () => {
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'map')
    );

    act(() => {
      result.current.setSortBy('price_diesel');
      result.current.setSortDirection('low_to_high');
    });

    expect(result.current.sortedStations[0].diesel).toBe(1.549);
    expect(result.current.sortedStations[1].diesel).toBe(1.569);
  });

  it('finds best prices', () => {
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'map')
    );

    expect(result.current.bestPrices.diesel).toBeDefined();
    expect(result.current.bestPrices.diesel?.price).toBe(1.549);
    expect(result.current.bestPrices.diesel?.stationId).toBe('1');
  });

  it('handles price filter changes', () => {
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'map')
    );

    act(() => {
      result.current.setPriceFilter('diesel');
    });

    expect(result.current.priceFilter).toBe('diesel');
  });

  it('calculates average price', () => {
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'map')
    );

    // Calculate expected average
    const totalDiesel = 1.549 + 1.569;
    const totalE5 = 1.599 + 1.609;
    const totalE10 = 1.529 + 1.549;
    const expectedAverage = (totalDiesel + totalE5 + totalE10) / 6;
    
    expect(result.current.averagePrice).toBe(expectedAverage.toFixed(3));
  });

  it('handles scrollToStation for list view', () => {
    const scrollIntoViewMock = jest.fn();
    const addClassMock = jest.fn();
    const removeClassMock = jest.fn();
    
    const mockElement = {
      scrollIntoView: scrollIntoViewMock,
      classList: {
        add: addClassMock,
        remove: removeClassMock,
      },
    };
    
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);
    
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'list')
    );

    act(() => {
      result.current.scrollToStation('1');
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    expect(addClassMock).toHaveBeenCalledWith('highlighted');
  });

  it('handles handleBestPriceClick for map view', () => {
    const dispatchEventMock = jest.spyOn(window, 'dispatchEvent');
    
    const { result } = renderHook(() => 
      useDataProcessing(mockData, mockUserLocation, 'map')
    );

    act(() => {
      result.current.handleBestPriceClick('1', 'diesel');
    });

    expect(dispatchEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'flyToStation',
        detail: expect.objectContaining({
          stationId: '1',
          fuelType: 'diesel',
        }),
      })
    );
  });
});