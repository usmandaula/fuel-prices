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
  fetchPrices
} from './gasStationService';

describe('TankerKönig API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // fetchGasStations
  // ---------------------------------------------------------------------------
  describe('fetchGasStations', () => {
    it('returns transformed gas station data', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          ok: true,
          license: 'test-license',
          data: 'test-data',
          status: 'ok',
          stations: [
            {
              id: '1',
              name: 'Test Station',
              brand: 'Shell',
              street: 'Main St',
              place: 'Berlin',
              lat: 52,
              lng: 13,
              dist: 1,
              diesel: 1.8,
              e5: 1.9,
              e10: 1.7,
              isOpen: true,
              houseNumber: '1',
              postCode: 10115
            }
          ]
        }
      });

      const result = await fetchGasStations(52, 13, 5, {
        apiKey: 'valid-api-key'
      });

      expect(result.ok).toBe(true);
      expect(result.stations).toHaveLength(1);
      expect(result.stations[0].name).toBe('Test Station');
    });

    it('throws error for invalid API key', async () => {
      await expect(
        fetchGasStations(52, 13, 5, {
          apiKey: '00000000-0000-0000-0000-000000000002'
        })
      ).rejects.toThrow('Valid API key is required');
    });
  });

  // ---------------------------------------------------------------------------
  // fetchGasStationsCached
  // ---------------------------------------------------------------------------
describe('fetchGasStationsCached', () => {
  it('returns cached data on second call', async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: {
        ok: true,
        license: 'license',
        data: 'data',
        status: 'ok',
        stations: []
      }
    });

    const first = await fetchGasStationsCached(52, 13, 5, {
      apiKey: 'valid-api-key'
    });

    const second = await fetchGasStationsCached(52, 13, 5, {
      apiKey: 'valid-api-key'
    });

    expect(first).toEqual(second);
  });
});



  // ---------------------------------------------------------------------------
  // fetchGasStationsWithRetry
  // ---------------------------------------------------------------------------
  describe('fetchGasStationsWithRetry', () => {
    it('retries on server error and succeeds', async () => {
      mockAxiosInstance.get
        .mockRejectedValueOnce({
          response: { status: 500 },
          isAxiosError: true
        })
        .mockResolvedValueOnce({
          data: {
            ok: true,
            license: 'license',
            data: 'data',
            status: 'ok',
            stations: []
          }
        });

      const result = await fetchGasStationsWithRetry(52, 13, 5, {
        apiKey: 'valid-api-key',
        maxRetries: 2,
        retryDelay: 1
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchStationDetails
  // ---------------------------------------------------------------------------
  describe('fetchStationDetails', () => {
    it('returns station details', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          ok: true,
          status: 'ok',
          station: {
            id: '1',
            name: 'Detail Station'
          }
        }
      });

      const station = await fetchStationDetails('1', 'valid-api-key');

      expect(station.id).toBe('1');
      expect(station.name).toBe('Detail Station');
    });
  });

  // ---------------------------------------------------------------------------
  // fetchPrices
  // ---------------------------------------------------------------------------
  describe('fetchPrices', () => {
    it('returns prices for stations', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          ok: true,
          status: 'ok',
          prices: {
            '1': { diesel: 1.8, e5: 1.9, e10: 1.7 }
          }
        }
      });

      const prices = await fetchPrices(['1'], 'valid-api-key');

      expect(prices['1'].diesel).toBe(1.8);
      expect(prices['1'].e5).toBe(1.9);
      expect(prices['1'].e10).toBe(1.7);
    });
  });
});
