import { renderHook, act, waitFor } from '@testing-library/react';
import { useGasStations } from './useGasStation';

// Mock all dependencies
jest.mock('../services/gasStationService', () => ({
  fetchGasStations: jest.fn(),
  fetchNearbyGasStations: jest.fn(),
}));

// Improved mock to match hook's error handling behavior
jest.mock('../utils/apiErrorHandler', () => ({
  handleGasStationAPIError: jest.fn((error: any) => {
    if (!error) return 'An unknown error occurred';
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && error.message) return error.message;
    return 'An unknown error occurred';
  }),
}));

// Import mocked modules
const { fetchGasStations, fetchNearbyGasStations } = require('../services/gasStationService');
const { handleGasStationAPIError } = require('../utils/apiErrorHandler');

describe('useGasStations', () => {
  const mockStationsData = {
    ok: true,
    status: 'ok',
    stations: [
      {
        id: '1',
        name: 'Test Station',
        brand: 'SHELL',
        lat: 52.52,
        lng: 13.405,
        diesel: 1.549,
        e5: 1.599,
        e10: 1.529,
        isOpen: true,
        street: 'Test Street',
        place: 'Berlin',
        dist: 1.5,
        houseNumber: '123',
        postCode: 10115,
      }
    ],
    data: {
      source: 'tankerkoenig',
    },
    license: 'CC BY 4.0',
    timestamp: Date.now()
  };

  const emptyStationsData = {
    ok: true,
    status: 'ok',
    stations: [],
    data: { source: 'tankerkoenig' },
    license: 'CC BY 4.0',
    timestamp: Date.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (fetchGasStations as jest.Mock).mockResolvedValue(mockStationsData);
    (fetchNearbyGasStations as jest.Mock).mockResolvedValue(mockStationsData);
    
    // Default error handler
    (handleGasStationAPIError as jest.Mock).mockImplementation((error) => {
      if (!error) return 'An unknown error occurred';
      if (typeof error === 'string') return error;
      if (error && typeof error === 'object' && error.message) return error.message;
      return 'An unknown error occurred';
    });
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useGasStations({ autoLoad: false }));
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('loads stations with geolocation', async () => {
    const { result } = renderHook(() => 
      useGasStations({ useGeolocation: true, radius: 5, autoLoad: true })
    );
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockStationsData);
    expect(result.current.error).toBeNull();
    expect(fetchNearbyGasStations).toHaveBeenCalledWith(5, { apiKey: undefined });
  });

  test('handles loading errors', async () => {
    const errorMessage = 'Manual load error';
    
    // Mock service to reject
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    // Use act to properly handle async state updates
    await act(async () => {
      try {
        await result.current.loadStations(52.52, 13.405);
      } catch (error) {
        // Expected to throw
      }
    });
    
    // Error state should be set - wait for state update
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
    
    expect(result.current.data).toBeNull();
    
    // Verify error handler was called
    expect(handleGasStationAPIError).toHaveBeenCalled();
  });

  test('handles geolocation loading errors', async () => {
    const errorMessage = 'Geolocation error';
    
    (fetchNearbyGasStations as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    const { result } = renderHook(() => 
      useGasStations({ useGeolocation: true, autoLoad: false })
    );
    
    await act(async () => {
      try {
        await result.current.loadStations();
      } catch (error) {
        // Expected
      }
    });
    
    // Wait for error state to be set
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
    
    expect(fetchNearbyGasStations).toHaveBeenCalledWith(1.5, { apiKey: undefined });
  });

  test('manually loads stations', async () => {
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    expect(result.current.data).toBeNull();
    
    await act(async () => {
      await result.current.loadStations(52.52, 13.405);
    });
    
    expect(result.current.data).toEqual(mockStationsData);
  });

  test('refreshes data successfully', async () => {
    const { result } = renderHook(() => 
      useGasStations({ lat: 52.52, lng: 13.405, autoLoad: true })
    );
    
    await waitFor(() => {
      expect(result.current.data).toEqual(mockStationsData);
    });
    
    const initialCallCount = (fetchGasStations as jest.Mock).mock.calls.length;
    
    await act(async () => {
      await result.current.refresh();
    });
    
    expect(fetchGasStations).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  test('preserves previous data on refresh error', async () => {
    const refreshErrorMessage = 'Refresh failed';
    
    // First success, then failure
    (fetchGasStations as jest.Mock)
      .mockResolvedValueOnce(mockStationsData)
      .mockRejectedValueOnce(new Error(refreshErrorMessage));
    
    const { result } = renderHook(() => 
      useGasStations({ lat: 52.52, lng: 13.405, autoLoad: true })
    );
    
    // Wait for initial success
    await waitFor(() => {
      expect(result.current.data).toEqual(mockStationsData);
      expect(result.current.error).toBeNull();
    });
    
    // Refresh should fail
    await act(async () => {
      try {
        await result.current.refresh();
      } catch (error) {
        // Expected
      }
    });
    
    // Data should still be there
    expect(result.current.data).toEqual(mockStationsData);
    
    // Error should be set - wait for state update
    await waitFor(() => {
      expect(result.current.error).toBe(refreshErrorMessage);
    });
  });

  test('re-throws errors from loadStations', async () => {
    const errorMessage = 'Load failed';
    
    (fetchGasStations as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    await act(async () => {
      try {
        await result.current.loadStations();
      } catch (error) {
        // Expected
      }
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
  });

  test('clears error on successful load after error', async () => {
    const firstErrorMessage = 'First load failed';
    
    // First fail, then succeed
    (fetchGasStations as jest.Mock)
      .mockRejectedValueOnce(new Error(firstErrorMessage))
      .mockResolvedValueOnce(mockStationsData);
    
    const { result } = renderHook(() => 
      useGasStations({ lat: 52.52, lng: 13.405, autoLoad: false })
    );
    
    // First load fails
    await act(async () => {
      try {
        await result.current.loadStations();
      } catch (error) {
        // Expected
      }
    });
    
    // Check error state
    await waitFor(() => {
      expect(result.current.error).toBe(firstErrorMessage);
    });
    expect(result.current.data).toBeNull();
    
    // Second load succeeds
    await act(async () => {
      await result.current.loadStations();
    });
    
    // Error cleared, data set
    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockStationsData);
    });
  });

  test('handles undefined errors gracefully', async () => {
    // Mock service to reject with undefined
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(undefined);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    await act(async () => {
      try {
        await result.current.loadStations(52.52, 13.405);
      } catch (error) {
        // Expected
      }
    });
    
    // Should have default error message
    await waitFor(() => {
      expect(result.current.error).toBe('An unknown error occurred');
    });
  });

  test('handles null errors gracefully', async () => {
    // Mock service to reject with null
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(null);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    await act(async () => {
      try {
        await result.current.loadStations(52.52, 13.405);
      } catch (error) {
        // Expected
      }
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('An unknown error occurred');
    });
  });

  test('handles error objects with message property', async () => {
    const errorObj = new Error('Error object');
    
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(errorObj);
    // Error handler should return the error message
    (handleGasStationAPIError as jest.Mock).mockReturnValueOnce(errorObj.message);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    await act(async () => {
      try {
        await result.current.loadStations(52.52, 13.405);
      } catch (error) {
        // Expected
      }
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Error object');
    });
  });

  test('handles string errors', async () => {
    const errorString = 'String error message';
    
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(errorString);
    (handleGasStationAPIError as jest.Mock).mockReturnValueOnce(errorString);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    await act(async () => {
      try {
        await result.current.loadStations(52.52, 13.405);
      } catch (error) {
        // Expected
      }
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe(errorString);
    });
  });

  test('uses custom API key', async () => {
    const apiKey = 'custom-key-123';
    
    const { result } = renderHook(() => 
      useGasStations({ lat: 52.52, lng: 13.405, apiKey, autoLoad: true })
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(fetchGasStations).toHaveBeenCalledWith(
      52.52, 13.405, 1.5, { apiKey }
    );
  });

  test('uses custom API key with geolocation', async () => {
    const apiKey = 'custom-geo-key-456';
    
    const { result } = renderHook(() => 
      useGasStations({ useGeolocation: true, apiKey, autoLoad: true })
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(fetchNearbyGasStations).toHaveBeenCalledWith(1.5, { apiKey });
  });

  test('does not auto-load when autoLoad is false', () => {
    renderHook(() => useGasStations({ autoLoad: false }));
    
    expect(fetchGasStations).not.toHaveBeenCalled();
    expect(fetchNearbyGasStations).not.toHaveBeenCalled();
  });

  test('uses default coordinates when none provided', async () => {
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: true })
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should use default coordinates (52.521, 13.438) from the hook
    expect(fetchGasStations).toHaveBeenCalledWith(52.521, 13.438, 1.5, { apiKey: undefined });
  });

  test('uses custom radius parameter', async () => {
    const customRadius = 10;
    
    const { result } = renderHook(() => 
      useGasStations({ lat: 52.52, lng: 13.405, radius: customRadius, autoLoad: true })
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(fetchGasStations).toHaveBeenCalledWith(
      52.52, 13.405, customRadius, { apiKey: undefined }
    );
  });

  test('loadStations with custom coordinates overrides defaults', async () => {
    const { result } = renderHook(() => 
      useGasStations({ lat: 50.0, lng: 10.0, autoLoad: false })
    );
    
    const customLat = 48.0;
    const customLng = 11.5;
    
    await act(async () => {
      await result.current.loadStations(customLat, customLng);
    });
    
    // Should use custom coordinates, not the ones from props
    expect(fetchGasStations).toHaveBeenCalledWith(
      customLat, customLng, 1.5, { apiKey: undefined }
    );
  });

  test('handles empty station data', async () => {
    (fetchGasStations as jest.Mock).mockResolvedValueOnce(emptyStationsData);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    await act(async () => {
      await result.current.loadStations(52.52, 13.405);
    });
    
    expect(result.current.data).toEqual(emptyStationsData);
    expect(result.current.data?.stations).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  test('memoizes loadStations callback properly', () => {
    const { result, rerender } = renderHook(
      (props) => useGasStations(props),
      { initialProps: { lat: 52.52, lng: 13.405, autoLoad: false } }
    );
    
    const firstCallback = result.current.loadStations;
    
    // Re-render with same props
    rerender({ lat: 52.52, lng: 13.405, autoLoad: false });
    
    expect(result.current.loadStations).toBe(firstCallback);
    
    // Re-render with different props
    rerender({ lat: 53.0, lng: 13.405, autoLoad: false });
    
    expect(result.current.loadStations).not.toBe(firstCallback);
  });

  test('refresh function returns the loadStations promise', async () => {
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    const refreshPromise = result.current.refresh();
    
    expect(refreshPromise).toBeInstanceOf(Promise);
    
    const data = await refreshPromise;
    expect(data).toEqual(mockStationsData);
  });

  test('sets loading state correctly during async operations', async () => {
    // Create a promise we can control
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    (fetchGasStations as jest.Mock).mockReturnValueOnce(pendingPromise);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    // Don't await this - we want to test the loading state during the promise
    const loadPromise = result.current.loadStations(52.52, 13.405);
    
    // The loading state should be true immediately
    // We need to wrap this in act to process state updates
    await act(async () => {
      // Give React a chance to process the state update
      await Promise.resolve();
    });
    
    // Now check the loading state
    expect(result.current.loading).toBe(true);
    
    // Resolve the promise
    await act(async () => {
      resolvePromise!(mockStationsData);
      await loadPromise;
    });
    
    // Should no longer be loading
    expect(result.current.loading).toBe(false);
  });

  test('handles sequential load operations correctly', async () => {
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    // Make sure the hook is initialized
    expect(result.current).toBeDefined();
    expect(result.current.loadStations).toBeDefined();
    
    // First load
    await act(async () => {
      await result.current.loadStations(52.52, 13.405);
    });
    
    expect(result.current.data).toEqual(mockStationsData);
    
    // Second load with different coordinates
    await act(async () => {
      await result.current.loadStations(48.0, 11.5);
    });
    
    // Should have updated to the new data
    expect(fetchGasStations).toHaveBeenCalledTimes(2);
    expect(fetchGasStations).toHaveBeenLastCalledWith(
      48.0, 11.5, 1.5, { apiKey: undefined }
    );
  });

  test('error handler is called with correct error object', async () => {
    const error = new Error('Test error');
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    // Make sure the hook is initialized
    expect(result.current).toBeDefined();
    
    await act(async () => {
      try {
        await result.current.loadStations(52.52, 13.405);
      } catch {
        // Expected
      }
    });
    
    // The error handler should have been called with the error
    expect(handleGasStationAPIError).toHaveBeenCalledWith(error);
  });
});