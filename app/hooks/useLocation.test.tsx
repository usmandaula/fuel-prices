import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocation } from './useLocation';

describe('useLocation', () => {
  const mockGeolocation = {
    getCurrentPosition: jest.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
    localStorage.clear();
  });

  it('initializes with initial location', () => {
    const initialLocation = { lat: 52.52, lng: 13.405, name: 'Berlin' };
    const { result } = renderHook(() => useLocation(initialLocation));
    
    expect(result.current.userLocation).toEqual(initialLocation);
    expect(result.current.searchedLocation).toBeNull();
  });

  it('gets user location when no initial location provided', async () => {
    const mockPosition = {
      coords: {
        latitude: 52.52,
        longitude: 13.405,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useLocation(null));

    await waitFor(() => {
      expect(result.current.userLocation).toEqual({
        lat: 52.52,
        lng: 13.405,
        name: 'Current Location',
      });
    });
  });

  it('handles location found', () => {
    const mockLocation = { lat: 52.52, lng: 13.405, name: 'Test Location' };
    const onLocationSearch = jest.fn();
    
    const { result } = renderHook(() => useLocation(null, onLocationSearch));
    
    act(() => {
      result.current.handleLocationFound(mockLocation);
    });

    expect(result.current.searchedLocation).toEqual(mockLocation);
    expect(result.current.userLocation).toEqual(mockLocation);
    expect(onLocationSearch).toHaveBeenCalledWith(mockLocation);
  });

  it('handles geolocation error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(new Error('Geolocation error'));
    });

    const { result } = renderHook(() => useLocation(null));

    // Should not crash when geolocation fails
    await waitFor(() => {
      expect(result.current.isLocating).toBe(false);
    });
  });
});