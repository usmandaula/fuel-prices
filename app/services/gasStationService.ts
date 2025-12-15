import axios from 'axios';
import { GasStationData, GasStation } from '../types/gasStationTypes';

// API Configuration
const API_BASE_URL = 'https://creativecommons.tankerkoenig.de/json';
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_TANKERKOENIG_API_KEY || '00000000-0000-0000-0000-000000000002';
const DEFAULT_LAT = Number(process.env.NEXT_PUBLIC_DEFAULT_LAT) || 52.521;
const DEFAULT_LNG = Number(process.env.NEXT_PUBLIC_DEFAULT_LNG) || 13.438;
const DEFAULT_RADIUS = Number(process.env.NEXT_PUBLIC_DEFAULT_RADIUS) || 5;

// Type definitions
interface TankerKoenigStation {
  id: string;
  name: string;
  brand: string;
  street: string;
  place: string;
  lat: number;
  lng: number;
  dist: number;
  diesel: number;
  e5: number;
  e10: number;
  isOpen: boolean;
  houseNumber: string;
  postCode: number;
}

interface TankerKoenigResponse {
  ok: boolean;
  license: string;
  data: string;
  status: string;
  stations?: TankerKoenigStation[];
}

interface FetchOptions {
  apiKey?: string;
  sort?: 'dist' | 'price';
  fuelType?: 'all' | 'e5' | 'e10' | 'diesel';
  includeClosed?: boolean;
}

// Common headers
const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'FuelFinder-App/1.0'
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: DEFAULT_HEADERS
});

/**
 * Validates API parameters
 */
const validateParams = (apiKey: string, radius: number): void => {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  if (radius > 25) {
    throw new Error('Radius cannot exceed 25 km');
  }
};

/**
 * Transforms API response to our format
 */
const transformResponse = (
  response: TankerKoenigResponse, 
  includeClosed: boolean
): GasStationData => {
  let stations = response.stations || [];
  
  if (!includeClosed) {
    stations = stations.filter(station => station.isOpen);
  }
  
  return {
    ok: response.ok,
    license: response.license,
    data: response.data,
    status: response.status,
    stations
  };
};

/**
 * Handles API errors with proper error messages
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    }
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Unknown error';
      throw new Error(`API Error ${status}: ${message}`);
    }
    
    if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    }
  }
  
  if (error instanceof Error) {
    throw error;
  }
  
  throw new Error('Failed to fetch gas stations. Please try again.');
};

/**
 * Fetches gas stations from Tankerkönig API
 */
export const fetchGasStations = async (
  lat: number = DEFAULT_LAT,
  lng: number = DEFAULT_LNG,
  radius: number = DEFAULT_RADIUS,
  options: FetchOptions = {}
): Promise<GasStationData> => {
  try {
    const {
      apiKey = DEFAULT_API_KEY,
      sort = 'dist',
      fuelType = 'all',
      includeClosed = false
    } = options;

    // Validate parameters
    validateParams(apiKey, radius);

    // Build URL params
    const params = {
      lat: lat.toString(),
      lng: lng.toString(),
      rad: radius.toString(),
      sort,
      type: fuelType,
      apikey: apiKey
    };

    // Make API request
    const { data } = await apiClient.get<TankerKoenigResponse>('/list.php', { params });
    
    // Check if response is OK
    if (!data.ok) {
      throw new Error(`API returned error: ${data.status}`);
    }

    // Transform and return data
    return transformResponse(data, includeClosed);

  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Creates a cache key from parameters
 */
const createCacheKey = (lat: number, lng: number, radius: number, apiKey: string): string => {
  return `gas_stations_${lat}_${lng}_${radius}_${apiKey}`;
};

/**
 * Cached version of fetchGasStations with localStorage support
 */
export const fetchGasStationsCached = async (
  lat: number = DEFAULT_LAT,
  lng: number = DEFAULT_LNG,
  radius: number = DEFAULT_RADIUS,
  options: FetchOptions & { cacheDuration?: number } = {}
): Promise<GasStationData> => {
  const { cacheDuration = 5 * 60 * 1000, ...fetchOptions } = options; // Default 5 minutes
  const apiKey = fetchOptions.apiKey || DEFAULT_API_KEY;
  
  const cacheKey = createCacheKey(lat, lng, radius, apiKey);
  
  try {
    // Check cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      
      // Use cache if valid
      if (Date.now() - timestamp < cacheDuration) {
        console.log('Returning cached gas station data');
        return data;
      }
    }
    
    // Fetch fresh data
    const freshData = await fetchGasStations(lat, lng, radius, fetchOptions);
    
    // Update cache
    localStorage.setItem(cacheKey, JSON.stringify({
      data: freshData,
      timestamp: Date.now()
    }));
    
    return freshData;
  } catch (error) {
    // Fallback to expired cache on error
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      console.warn('Using expired cache due to fetch error');
      return data;
    }
    
    throw error instanceof Error ? error : new Error('Failed to fetch gas stations');
  }
};

/**
 * Fetches gas stations with retry logic
 */
export const fetchGasStationsWithRetry = async (
  lat: number = DEFAULT_LAT,
  lng: number = DEFAULT_LNG,
  radius: number = DEFAULT_RADIUS,
  options: FetchOptions & { maxRetries?: number; retryDelay?: number } = {}
): Promise<GasStationData> => {
  const { maxRetries = 3, retryDelay = 1000, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchGasStations(lat, lng, radius, fetchOptions);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors
      if (error instanceof Error && (
        error.message.includes('API key') ||
        error.message.includes('Radius cannot exceed')
      )) {
        break;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  throw lastError || new Error('Failed to fetch gas stations after retries');
};

/**
 * Gets nearby gas stations using geolocation
 */
export const fetchNearbyGasStations = async (
  radius: number = DEFAULT_RADIUS,
  options: FetchOptions & { 
    enableHighAccuracy?: boolean; 
    timeout?: number;
  } = {}
): Promise<GasStationData> => {
  const { enableHighAccuracy = true, timeout = 10000, ...fetchOptions } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      try {
        const { latitude, longitude } = position.coords;
        const data = await fetchGasStations(latitude, longitude, radius, fetchOptions);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      const messages: Record<number, string> = {
        1: 'Permission denied. Please allow location access.',
        2: 'Location information is unavailable.',
        3: 'Location request timed out.'
      };
      
      reject(new Error(`Failed to get location: ${messages[error.code] || 'Unknown error'}`));
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy, timeout, maximumAge: 0 }
    );
  });
};

/**
 * Fetches detailed information for a single gas station
 */
export const fetchStationDetails = async (
  stationId: string,
  apiKey: string = DEFAULT_API_KEY
): Promise<GasStation> => {
  try {
    const { data } = await apiClient.get<{ ok: boolean; status: string; station: GasStation }>('/detail.php', {
      params: { id: stationId, apikey: apiKey },
      timeout: 5000
    });

    if (!data.ok) {
      throw new Error(`Failed to fetch station details: ${data.status}`);
    }

    return data.station;
  } catch (error) {
    throw new Error(`Failed to fetch station details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetches prices for specific stations
 */
export const fetchPrices = async (
  stationIds: string[],
  apiKey: string = DEFAULT_API_KEY
): Promise<Record<string, { diesel: number; e5: number; e10: number }>> => {
  try {
    const { data } = await apiClient.get<{ 
      ok: boolean; 
      status: string; 
      prices: Record<string, { diesel: number; e5: number; e10: number }> 
    }>('/prices.php', {
      params: { ids: stationIds.join(','), apikey: apiKey },
      timeout: 5000
    });

    if (!data.ok) {
      throw new Error(`Failed to fetch prices: ${data.status}`);
    }

    return data.prices;
  } catch (error) {
    throw new Error(`Failed to fetch prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export configuration
export const API_CONFIG = {
  DEFAULT_LAT,
  DEFAULT_LNG,
  DEFAULT_RADIUS,
  DEFAULT_API_KEY
};

// Export all functions
export default {
  fetchGasStations,
  fetchStationDetails,
  fetchPrices,
  fetchGasStationsWithRetry,
  fetchGasStationsCached,
  fetchNearbyGasStations,
  API_CONFIG
};