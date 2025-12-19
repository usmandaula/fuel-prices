import { 
  fetchGasStations, 
  fetchGasStationsCached, 
  fetchNearbyGasStations,
  fetchGasStationsWithRetry 
} from './gasStationService';

// Mock axios with a simpler approach
const mockAxiosInstance = {
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn((error: any) => error?.isAxiosError === true)
  },
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn((error: any) => error?.isAxiosError === true)
}));

import axios from 'axios';

// Mock btoa
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

// Simple localStorage mock
const mockLocalStorage: Record<string, string> = {};

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(mockLocalStorage).forEach(key => {
        delete mockLocalStorage[key];
      });
    }),
    key: jest.fn(),
    length: 0
  },
  writable: true
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(window.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('gasStationService', () => {
  const mockApiResponse = {
    ok: true,
    status: 'ok',
    license: 'CC BY 4.0',
    data: 'tankerkoenig',
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
        postCode: 10115
      }
    ],
    timestamp: Date.now()
  };

  const mockSuccessResponse = {
    data: mockApiResponse,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear localStorage
    Object.keys(mockLocalStorage).forEach(key => {
      delete mockLocalStorage[key];
    });
    
    // Reset axios mocks
    mockAxiosInstance.get.mockReset();
    (axios.create as jest.Mock).mockClear();
    (axios.isAxiosError as jest.Mock).mockClear();
    
    // Setup default responses
    mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse);
    
    // Setup geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 52.52,
          longitude: 13.405,
          accuracy: 50
        },
        timestamp: Date.now()
      });
    });
    
    // Setup btoa
    (global.btoa as jest.Mock).mockReturnValue('mockCacheKey');
  });

  describe('fetchGasStations', () => {
    test('fetches gas stations successfully', async () => {
      const result = await fetchGasStations(52.52, 13.405, 5);
      
      expect(axios.create).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(true);
      expect(result.stations).toHaveLength(1);
    });

    test('handles network errors', async () => {
      // Create a proper axios error structure
      const networkError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'Network Error',
        response: undefined,
        request: {}
      };
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(fetchGasStations(52.52, 13.405, 5))
        .rejects.toThrow('Request timeout');
    });
  });

  describe('fetchGasStationsCached', () => {
    test('returns cached data when available', async () => {
      const cacheKey = 'fuel_finder_cache_mockCacheKey';
      const cachedEntry = {
        data: mockApiResponse,
        timestamp: Date.now(),
        expiry: Date.now() + 300000
      };
      
      // Set cache
      mockLocalStorage[cacheKey] = JSON.stringify(cachedEntry);

      const result = await fetchGasStationsCached(52.52, 13.405, 5);
      
      // Should use cache
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });
  });

  describe('fetchGasStationsWithRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('retries on failure and succeeds', async () => {
      // Setup sequence: fail twice, then succeed
      mockAxiosInstance.get
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce(mockSuccessResponse);

      const fetchPromise = fetchGasStationsWithRetry(52.52, 13.405, 5);
      
      // IMPORTANT: Run all pending timers
      jest.runAllTimers();
      
      const result = await fetchPromise;
      
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
      expect(result.ok).toBe(true);
    });
  });

  describe('fetchNearbyGasStations', () => {
    test('fetches nearby stations successfully', async () => {
      const result = await fetchNearbyGasStations(5);
      
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(true);
    });
  });
});