// hooks/useGasStations.ts
import { useState, useEffect, useCallback } from 'react';
import { GasStationData } from '../types/gasStationTypes';
import { fetchGasStations, fetchNearbyGasStations } from '../services/gasStationService';
import { handleGasStationAPIError } from '../utils/apiErrorHandler';

interface UseGasStationsOptions {
  useGeolocation?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  autoLoad?: boolean;
  apiKey?: string;
}

export const useGasStations = (options: UseGasStationsOptions = {}) => {
  const {
    useGeolocation = false,
    lat,
    lng,
    radius = 1.5,
    autoLoad = true,
    apiKey
  } = options;

  const [data, setData] = useState<GasStationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStations = useCallback(async (customLat?: number, customLng?: number) => {
    setLoading(true);
    setError(null);

    try {
      let stationsData: GasStationData;

      if (useGeolocation) {
        stationsData = await fetchNearbyGasStations(radius, { apiKey });
      } else {
        const targetLat = customLat || lat || 52.521;
        const targetLng = customLng || lng || 13.438;
        stationsData = await fetchGasStations(targetLat, targetLng, radius, { apiKey });
      }

      setData(stationsData);
      return stationsData;
    } catch (err) {
      const apiError = handleGasStationAPIError(err);
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [useGeolocation, lat, lng, radius, apiKey]);

  useEffect(() => {
    if (autoLoad) {
      loadStations();
    }
  }, [autoLoad, loadStations]);

  return {
    data,
    loading,
    error,
    loadStations,
    refresh: () => loadStations()
  };
};