import axios, { AxiosResponse } from 'axios';
import { GasStationData, GasStation } from '../types/gasStationTypes';

// API Configuration
const API_BASE_URL = 'https://creativecommons.tankerkoenig.de/json';
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_TANKERKOENIG_API_KEY || '00000000-0000-0000-0000-000000000002';
const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || '52.521');
const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || '13.438');
const DEFAULT_RADIUS = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_RADIUS || '5');

// // Default coordinates (Berlin center)
// const DEFAULT_LAT = 52.521;
// const DEFAULT_LNG = 13.438;
// const DEFAULT_RADIUS = 1.5; // km

// API response interface
interface TankerKoenigResponse {
  ok: boolean;
  license: string;
  data: string;
  status: string;
  stations?: Array<{
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
  }>;
}
/**
 * Fetches gas stations from Tankerkönig API
 */
export const fetchGasStations = async (
  lat: number = DEFAULT_LAT,
  lng: number = DEFAULT_LNG,
  radius: number = DEFAULT_RADIUS,
  options: {
    apiKey?: string;
    sort?: 'dist' | 'price';
    fuelType?: 'all' | 'e5' | 'e10' | 'diesel';
    includeClosed?: boolean;
  } = {}
): Promise<GasStationData> => {
  try {
    const {
      apiKey = DEFAULT_API_KEY,
      sort = 'dist',
      fuelType = 'all',
      includeClosed = false
    } = options;

    // Validate parameters
    if (!apiKey) {
      throw new Error('API key is required');
    }

    if (radius > 25) {
      throw new Error('Radius cannot exceed 25 km');
    }

    // Build API URL
    const url = `${API_BASE_URL}/list.php`;
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      rad: radius.toString(),
      sort,
      type: fuelType,
      apikey: apiKey
    });

    // Make API request
    const response: AxiosResponse<TankerKoenigResponse> = await axios.get(url, {
      params,
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'FuelFinder-App/1.0'
      }
    });

    // Check if response is OK
    if (!response.data.ok) {
      throw new Error(`API returned error: ${response.data.status}`);
    }

    // Filter out closed stations if requested
    let stations = response.data.stations;
    if (!includeClosed) {
      stations = stations.filter(station => station.isOpen);
    }

    // Transform response to our format
    const gasStationData: GasStationData = {
      ok: response.data.ok,
      license: response.data.license,
      data: response.data.data,
      status: response.data.status,
      stations: stations
    };

    return gasStationData;

  } catch (error) {
    // Handle different types of errors
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`API Error ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      }
    }
    
    // Re-throw the error if it's already an Error instance
    if (error instanceof Error) {
      throw error;
    }
    
    // Fallback error
    throw new Error('Failed to fetch gas stations. Please try again.');
  }
};

/**
 * Fetches detailed information for a single gas station
 */
export const fetchStationDetails = async (
  stationId: string,
  apiKey: string = DEFAULT_API_KEY
): Promise<GasStation> => {
  try {
    const url = `${API_BASE_URL}/detail.php`;
    const response = await axios.get(url, {
      params: {
        id: stationId,
        apikey: apiKey
      },
      timeout: 5000
    });

    if (!response.data.ok) {
      throw new Error(`Failed to fetch station details: ${response.data.status}`);
    }

    return response.data.station as GasStation;
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
    const url = `${API_BASE_URL}/prices.php`;
    const response = await axios.get(url, {
      params: {
        ids: stationIds.join(','),
        apikey: apiKey
      },
      timeout: 5000
    });

    if (!response.data.ok) {
      throw new Error(`Failed to fetch prices: ${response.data.status}`);
    }

    return response.data.prices;
  } catch (error) {
    throw new Error(`Failed to fetch prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetches gas stations with retry logic
 */
export const fetchGasStationsWithRetry = async (
  lat: number,
  lng: number,
  radius: number,
  options: {
    apiKey?: string;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<GasStationData> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchGasStations(lat, lng, radius, fetchOptions);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof Error && (
        error.message.includes('API key') ||
        error.message.includes('Radius cannot exceed')
      )) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to fetch gas stations after retries');
};

/**
 * Cached version of fetchGasStations with localStorage support
 */
export const fetchGasStationsCached = async (
  lat: number,
  lng: number,
  radius: number,
  options: {
    apiKey?: string;
    cacheDuration?: number; // in milliseconds
  } = {}
): Promise<GasStationData> => {
  const { cacheDuration = 5 * 60 * 1000 } = options; // Default 5 minutes cache
  
  // Create cache key based on parameters
  const cacheKey = `gas_stations_${lat}_${lng}_${radius}_${options.apiKey || 'default'}`;
  
  try {
    // Check cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < cacheDuration) {
        console.log('Returning cached gas station data');
        return data;
      }
    }
    
    // Fetch fresh data
    const freshData = await fetchGasStations(lat, lng, radius, options);
    
    // Update cache
    localStorage.setItem(cacheKey, JSON.stringify({
      data: freshData,
      timestamp: Date.now()
    }));
    
    return freshData;
  } catch (error) {
    // Try to return cached data even if expired
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      console.warn('Using expired cache due to fetch error');
      return data;
    }
    
    throw error;
  }
};

/**
 * Gets nearby gas stations using geolocation
 */
export const fetchNearbyGasStations = async (
  radius: number = DEFAULT_RADIUS,
  options: {
    apiKey?: string;
    enableHighAccuracy?: boolean;
    timeout?: number;
  } = {}
): Promise<GasStationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const { enableHighAccuracy = true, timeout = 10000 } = options;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await fetchGasStations(
            latitude,
            longitude,
            radius,
            options
          );
          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let errorMessage = 'Failed to get location: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Permission denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Unknown error.';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 0 // Don't use cached position
      }
    );
  });
};

// Export the service
export default {
  fetchGasStations,
  fetchStationDetails,
  fetchPrices,
  fetchGasStationsWithRetry,
  fetchGasStationsCached,
  fetchNearbyGasStations,
  DEFAULT_LAT,
  DEFAULT_LNG,
  DEFAULT_RADIUS
};