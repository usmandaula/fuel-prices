import axios, { AxiosError, AxiosResponse } from 'axios';
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
  signal?: AbortSignal;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Constants
const CACHE_PREFIX = 'fuel_finder_cache_';
const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 10000;

// Common headers
const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'FuelFinder-App/1.0'
};

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: DEFAULT_HEADERS
});

// Request interceptor for adding API key
apiClient.interceptors.request.use((config) => {
  if (!config.params) config.params = {};
  
  // Add API key if not present
  if (!config.params.apikey) {
    config.params.apikey = DEFAULT_API_KEY;
  }
  
  return config;
});

/**
 * Validates API parameters
 */
const validateParams = (apiKey: string, radius: number): void => {
  if (!apiKey || apiKey === '00000000-0000-0000-0000-000000000002') {
    throw new Error('Valid API key is required. Please provide a TankerKönig API key.');
  }
  
  if (radius > 25) {
    throw new Error('Radius cannot exceed 25 km (API limitation)');
  }
  
  if (radius <= 0) {
    throw new Error('Radius must be greater than 0');
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
    stations,
    timestamp: Date.now()
  };
};

/**
 * Handles API errors with proper error messages
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    
    if (axiosError.response) {
      const status = axiosError.response.status;
      const message = (axiosError.response.data as any)?.message || axiosError.response.statusText;
      
      switch (status) {
        case 400:
          throw new Error('Invalid request parameters. Please check your input.');
        case 401:
          throw new Error('Invalid API key. Please provide a valid TankerKönig API key.');
        case 403:
          throw new Error('Access forbidden. Please check your API key permissions.');
        case 429:
          throw new Error('Too many requests. Please wait before trying again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error ${status}: ${message}`);
      }
    }
    
    if (axiosError.request) {
      throw new Error('No response from server. Please check your internet connection.');
    }
  }
  
  if (error instanceof Error) {
    throw error;
  }
  
  throw new Error('Failed to fetch gas stations. Please try again.');
};

/**
 * Creates a secure cache key from parameters
 */
const createCacheKey = (lat: number, lng: number, radius: number, options: FetchOptions): string => {
  const { sort = 'dist', fuelType = 'all', includeClosed = false } = options;
  
  // Use hash instead of API key for security
  const paramsString = `${lat}:${lng}:${radius}:${sort}:${fuelType}:${includeClosed}`;
  const paramsHash = btoa(paramsString)
    .replace(/=/g, '')
    .substring(0, 32);
  
  return `${CACHE_PREFIX}${paramsHash}`;
};

/**
 * Manages localStorage cache
 */
class CacheManager {
  static set<T>(key: string, data: T, duration: number = MAX_CACHE_AGE): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + duration
      };
      
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to write to cache:', error);
      // localStorage might be full or disabled
    }
  }
  
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() > entry.expiry) {
        this.remove(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn('Failed to read from cache:', error);
      this.remove(key);
      return null;
    }
  }
  
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from cache:', error);
    }
  }
  
  static cleanup(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => this.remove(key));
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }
}

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
      includeClosed = false,
      signal
    } = options;

    // Validate parameters
    validateParams(apiKey, radius);

    // Build URL params
    const params: Record<string, string> = {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      rad: radius.toString(),
      sort,
      type: fuelType,
      apikey: apiKey
    };

    // Make API request
    const response = await apiClient.get<TankerKoenigResponse>('/list.php', { 
      params,
      signal 
    });
    
    const data = response.data;
    
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
 * Cached version of fetchGasStations
 */
export const fetchGasStationsCached = async (
  lat: number = DEFAULT_LAT,
  lng: number = DEFAULT_LNG,
  radius: number = DEFAULT_RADIUS,
  
  options: FetchOptions & { cacheDuration?: number } = {}
): Promise<GasStationData> => {
    console.log('fetchGasStationsCached called with:', { lat, lng, radius });
  
  const { cacheDuration = MAX_CACHE_AGE, ...fetchOptions } = options;
  
  const cacheKey = createCacheKey(lat, lng, radius, fetchOptions);
  
  // Check cache first
  const cachedData = CacheManager.get<GasStationData>(cacheKey);
  if (cachedData) {
    console.log('Returning cached gas station data');
    return cachedData;
  }
  
  try {
    // Fetch fresh data
    const freshData = await fetchGasStations(lat, lng, radius, fetchOptions);
    
    // Update cache
    CacheManager.set(cacheKey, freshData, cacheDuration);
    
    return freshData;
  } catch (error) {
    // Fallback to cache even if expired
    const cachedData = CacheManager.get<GasStationData>(cacheKey);
    if (cachedData) {
      console.warn('Using expired cache due to fetch error');
      return cachedData;
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
  options: FetchOptions & { 
    maxRetries?: number; 
    retryDelay?: number;
  } = {}
): Promise<GasStationData> => {
  const { 
    maxRetries = MAX_RETRIES, 
    retryDelay = 1000, 
    ...fetchOptions 
  } = options;
  
  let lastError: Error | null = null;
  const abortController = new AbortController();
  const signal = abortController.signal;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchGasStations(lat, lng, radius, {
        ...fetchOptions,
        signal
      });
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors
      if (error instanceof Error && (
        error.message.includes('API key') ||
        error.message.includes('Radius cannot exceed') ||
        error.message.includes('Invalid request')
      )) {
        abortController.abort();
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

  abortController.abort();
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
  const { 
    enableHighAccuracy = true, 
    timeout = REQUEST_TIMEOUT, 
    ...fetchOptions 
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      try {
        const { latitude, longitude } = position.coords;
        const data = await fetchGasStationsWithRetry(
          latitude, 
          longitude, 
          radius, 
          fetchOptions
        );
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      const messages: Record<number, string> = {
        1: 'Permission denied. Please allow location access in your browser settings.',
        2: 'Location information is unavailable. Please check your device location services.',
        3: 'Location request timed out. Please try again.'
      };
      
      reject(new Error(messages[error.code] || 'Failed to get your location'));
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { 
        enableHighAccuracy, 
        timeout, 
        maximumAge: 60000 // 1 minute maximum age
      }
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
    validateParams(apiKey, 1); // Validate API key
    
    const response = await apiClient.get<{ ok: boolean; status: string; station: GasStation }>('/detail.php', {
      params: { 
        id: stationId, 
        apikey: apiKey 
      }
    });

    const data = response.data;

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
    validateParams(apiKey, 1); // Validate API key
    
    const response = await apiClient.get<{ 
      ok: boolean; 
      status: string; 
      prices: Record<string, { diesel: number; e5: number; e10: number }> 
    }>('/prices.php', {
      params: { 
        ids: stationIds.join(','), 
        apikey: apiKey 
      }
    });

    const data = response.data;

    if (!data.ok) {
      throw new Error(`Failed to fetch prices: ${data.status}`);
    }

    return data.prices;
  } catch (error) {
    throw new Error(`Failed to fetch prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Performs periodic cache cleanup
 */
export const initCacheCleanup = (intervalMs: number = 3600000): NodeJS.Timeout => {
  return setInterval(() => {
    CacheManager.cleanup();
  }, intervalMs);
};

// Export configuration
export const API_CONFIG = {
  DEFAULT_LAT,
  DEFAULT_LNG,
  DEFAULT_RADIUS,
  DEFAULT_API_KEY,
  MAX_CACHE_AGE,
  MAX_RETRIES,
  REQUEST_TIMEOUT
};

// Export all functions
export default {
  fetchGasStations,
  fetchStationDetails,
  fetchPrices,
  fetchGasStationsWithRetry,
  fetchGasStationsCached,
  fetchNearbyGasStations,
  initCacheCleanup,
  API_CONFIG
};