import { renderHook, act, waitFor } from '@testing-library/react';
import { useGasStations } from './useGasStation';

// Mock all dependencies
jest.mock('../services/gasStationService', () => ({
  fetchGasStations: jest.fn(),
  fetchNearbyGasStations: jest.fn(),
}));

// Simple mock that always returns a string (based on your hook handling)
jest.mock('../utils/apiErrorHandler', () => ({
  handleGasStationAPIError: jest.fn((error: any) => {
    // Always return string to match hook's first condition
    return error?.message || 'An unknown error occurred';
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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (fetchGasStations as jest.Mock).mockResolvedValue(mockStationsData);
    (fetchNearbyGasStations as jest.Mock).mockResolvedValue(mockStationsData);
    
    // Default error handler returns the error message
    (handleGasStationAPIError as jest.Mock).mockImplementation((error) => 
      error?.message || 'An unknown error occurred'
    );
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
  });

  test('handles loading errors', async () => {
    const errorMessage = 'Manual load error';
    
    // Mock service to reject
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    // Load and expect it to throw
    await expect(result.current.loadStations(52.52, 13.405))
      .rejects
      .toThrow(errorMessage);
    
    // Error state should be set
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.data).toBeNull();
    
    // Verify error handler was called
    expect(handleGasStationAPIError).toHaveBeenCalled();
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
    await expect(result.current.refresh())
      .rejects
      .toThrow(refreshErrorMessage);
    
    // Data should still be there
    expect(result.current.data).toEqual(mockStationsData);
    // Error should be set
    expect(result.current.error).toBe(refreshErrorMessage);
  });

  test('re-throws errors from loadStations', async () => {
    const errorMessage = 'Load failed';
    
    (fetchGasStations as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    await expect(result.current.loadStations())
      .rejects
      .toThrow(errorMessage);
    
    expect(result.current.error).toBe(errorMessage);
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
    try {
      await act(async () => {
        await result.current.loadStations();
      });
    } catch (error) {
      // Expected
    }
    
    // Check error state
    expect(result.current.error).toBe(firstErrorMessage);
    expect(result.current.data).toBeNull();
    
    // Second load succeeds
    await act(async () => {
      await result.current.loadStations();
    });
    
    // Error cleared, data set
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(mockStationsData);
  });

  test('handles undefined errors gracefully', async () => {
    // Mock service to reject with undefined
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(undefined);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    // Should throw default error message
    await expect(result.current.loadStations(52.52, 13.405))
      .rejects
      .toThrow('An unknown error occurred');
    
    // Should have default error message
    expect(result.current.error).toBe('An unknown error occurred');
  });

  test('handles null errors gracefully', async () => {
    // Mock service to reject with null
    (fetchGasStations as jest.Mock).mockRejectedValueOnce(null);
    
    const { result } = renderHook(() => 
      useGasStations({ autoLoad: false })
    );
    
    await expect(result.current.loadStations(52.52, 13.405))
      .rejects
      .toThrow('An unknown error occurred');
    
    expect(result.current.error).toBe('An unknown error occurred');
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
});