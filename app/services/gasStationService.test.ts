// --------------------------------------------------
// AXIOS MOCK — JEST HOIST SAFE (USES var)
// --------------------------------------------------
var mockAxiosInstance: {
  get: jest.Mock;
  interceptors: {
    request: {
      use: jest.Mock;
    };
  };
};

jest.mock('axios', () => {
  mockAxiosInstance = {
    get: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      }
    }
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      isAxiosError: jest.fn()
    }
  };
});

import {
  fetchGasStations,
  fetchGasStationsCached,
  fetchGasStationsWithRetry,
  fetchStationDetails,
  fetchPrices,
  fetchNearbyGasStations,
  initCacheCleanup
} from './gasStationService';

/* ------------------------------------------------------------------ */
/* Axios mock                                                          */
/* ------------------------------------------------------------------ */



beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

beforeAll(() => {
  jest.useFakeTimers();
});

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('TankerKönig API', () => {

  describe('fetchGasStations', () => {
    it('returns transformed gas station data', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          ok: true,
          license: 'test-license',
          data: 'test-data',
          status: 'ok',
          stations: [{ id: '1', isOpen: true }]
        }
      });

      const result = await fetchGasStations(52, 13, 5, { apiKey: 'valid-key' });
      expect(result.ok).toBe(true);
      expect(result.stations).toHaveLength(1);
    });

  it('throws error for invalid API key', async () => {
  mockAxiosInstance.get.mockRejectedValueOnce({
    isAxiosError: true,
    response: { status: 401 }
  });

  await expect(fetchGasStations(52, 13, 5, { apiKey: 'bad-key' }))
    .rejects.toThrow('Failed to fetch gas stations. Please try again.');
});

    it('filters out closed stations by default', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          ok: true,
          license: 'l',
          data: 'd',
          status: 'ok',
          stations: [
            { id: '1', isOpen: true },
            { id: '2', isOpen: false }
          ]
        }
      });

      const result = await fetchGasStations(52, 13, 5, { apiKey: 'valid-key' });
      expect(result.stations).toHaveLength(1);
      expect(result.stations[0].id).toBe('1');
    });

    it('includes closed stations when includeClosed=true', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          ok: true,
          license: 'l',
          data: 'd',
          status: 'ok',
          stations: [
            { id: '1', isOpen: true },
            { id: '2', isOpen: false }
          ]
        }
      });

      const result = await fetchGasStations(52, 13, 5, { apiKey: 'valid-key', includeClosed: true });
      expect(result.stations).toHaveLength(2);
    });

    it('throws timeout error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ECONNABORTED'
      });

      await expect(fetchGasStations(52, 13, 5, { apiKey: 'valid-key' }))
        .rejects.toThrow('Failed to fetch gas stations. Please try again.');
    });

    it('throws no response error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        isAxiosError: true,
        request: {}
      });

      await expect(fetchGasStations(52, 13, 5, { apiKey: 'valid-key' }))
        .rejects.toThrow('Failed to fetch gas stations. Please try again.');
    });
  });

  describe('fetchGasStationsCached', () => {
    it('returns cached data on second call', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { ok: true, license: 'l', data: 'd', status: 'ok', stations: [] }
      });

      const first = await fetchGasStationsCached(52, 13, 5, { apiKey: 'valid-key' });
      const second = await fetchGasStationsCached(52, 13, 5, { apiKey: 'valid-key' });

      expect(first).toEqual(second);
    });
  });

  describe('fetchGasStationsWithRetry', () => {
it('retries on server error and succeeds', async () => {
  jest.useFakeTimers();

  mockAxiosInstance.get
    .mockRejectedValueOnce({ isAxiosError: true, response: { status: 500 } })
    .mockResolvedValueOnce({
      data: { ok: true, license: 'l', data: 'd', status: 'ok', stations: [] }
    });

  const fetchPromise = fetchGasStationsWithRetry(52, 13, 5, {
    apiKey: 'valid-key',
    maxRetries: 2,
    retryDelay: 1 // tiny delay
  });

  // Run all timers and allow promises to resolve
  await jest.runAllTimersAsync?.(); // Jest >= 29 supports runAllTimersAsync
  const result = await fetchPromise;

  expect(result.ok).toBe(true);
  expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);

  jest.useRealTimers();
});




    it('does not retry on API key error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Invalid API key'));

      await expect(fetchGasStationsWithRetry(52, 13, 5, { apiKey: 'valid-key', maxRetries: 3 }))
        .rejects.toThrow('Invalid API key');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchStationDetails', () => {
    it('returns station details', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { ok: true, status: 'ok', station: { id: '1', name: 'Test Station' } }
      });

      const result = await fetchStationDetails('1', 'valid-key');
      expect(result.id).toBe('1');
      expect(result.name).toBe('Test Station');
    });
  });

  describe('fetchPrices', () => {
    it('returns prices for stations', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { ok: true, status: 'ok', prices: { '1': { diesel: 1, e5: 1.5, e10: 1.6 } } }
      });

      const result = await fetchPrices(['1']);
      expect(result['1'].e5).toBe(1.5);
      expect(result['1'].diesel).toBe(1);
    });
  });

  describe('fetchNearbyGasStations', () => {
    it('fetches stations using geolocation', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { ok: true, license: 'l', data: 'd', status: 'ok', stations: [] }
      });

      // @ts-ignore
      global.navigator.geolocation = { getCurrentPosition: jest.fn((success) => success({ coords: { latitude: 52, longitude: 13 } })) };

      const result = await fetchNearbyGasStations(5, { apiKey: 'valid-key' });
      expect(result.ok).toBe(true);
    });

    it('handles geolocation permission denied', async () => {
      // @ts-ignore
      global.navigator.geolocation = { getCurrentPosition: jest.fn((_s, error) => error({ code: 1 })) };

      await expect(fetchNearbyGasStations(5, { apiKey: 'valid-key' }))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('cache cleanup', () => {
    it('cleans up expired cache entries', () => {
      localStorage.setItem('fuel_finder_cache_test', JSON.stringify({ expiry: Date.now() - 1 }));
      const interval = initCacheCleanup(1);
      jest.advanceTimersByTime(2);
      clearInterval(interval);
    });
  });

});
/* ------------------------------------------------------------------ */
/* Additional tests for 100% coverage                                 */
/* ------------------------------------------------------------------ */

describe('Additional coverage tests', () => {

    




  describe('fetchGasStationsWithRetry edge cases', () => {
    it('fails after max retries', async () => {
      mockAxiosInstance.get
        .mockRejectedValue({ isAxiosError: true, response: { status: 500 } });

      await expect(fetchGasStationsWithRetry(52, 13, 5, { apiKey: 'valid-key', maxRetries: 2, retryDelay: 1 }))
        .rejects.toThrow('Failed to fetch gas stations. Please try again.');
    });
  });

  describe('fetchStationDetails edge cases', () => {
    it('throws error if ok=false', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { ok: false } });
      await expect(fetchStationDetails('1', 'valid-key')).rejects.toThrow('Failed to fetch station details');
    });

    it('throws network error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(fetchStationDetails('1', 'valid-key')).rejects.toThrow('Network error');
    });
  });

  describe('fetchPrices edge cases', () => {
    it('throws if ok=false', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { ok: false } });
      await expect(fetchPrices(['1'])).rejects.toThrow('Failed to fetch prices');
    });

    it('throws network error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(fetchPrices(['1'])).rejects.toThrow('Network error');
    });
  });

  describe('fetchNearbyGasStations edge cases', () => {
    it('handles position unavailable', async () => {
      // @ts-ignore
      global.navigator.geolocation = { getCurrentPosition: jest.fn((_s, err) => err({ code: 2 })) };
      await expect(fetchNearbyGasStations(5, { apiKey: 'valid-key' }))
        .rejects.toThrow('Location information is unavailable. Please check your device location services.');
    });
  });

  describe('handleApiError branches', () => {
    it('throws for unknown error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce('Unexpected error');
      await expect(fetchGasStations(52, 13, 5, { apiKey: 'valid-key' }))
        .rejects.toThrow('Failed to fetch gas stations. Please try again.');
    });
  });

});
