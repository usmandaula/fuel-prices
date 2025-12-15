"use client"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GasStationsList from './GasStationsList';
import './GasStationsList.css';
import { fetchGasStations, fetchGasStationsCached } from './services/gasStationService';

// Constants
const DEFAULT_LOCATION = {
  lat: 52.521,
  lng: 13.438,
  name: 'Berlin, Germany'
} as const;

const RADIUS_OPTIONS = [1, 3, 5, 10, 15, 25] as const;
const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
} as const;

// Types
type UserLocation = {
  lat: number;
  lng: number;
  name: string;
};

type SearchState = {
  lat: number;
  lng: number;
  name: string;
  radius: number;
  timestamp: number;
};

const App: React.FC = () => {
  // State
  const [gasStationData, setGasStationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [radius, setRadius] = useState<number>(5); // Default radius in km

  // Memoized values
  const geolocationSupported = useMemo(() => 
    typeof navigator !== 'undefined' && 'geolocation' in navigator, 
    []
  );

  /**
   * Fetch gas station data with error handling and caching
   */
  const fetchGasStationsData = useCallback(async (
    lat: number, 
    lng: number, 
    radius: number, 
    locationName: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching gas stations: ${lat}, ${lng}, radius: ${radius}km`);
      
      // Use cached API call for better performance
      const data = await fetchGasStationsCached(lat, lng, radius);
      
      console.log('Data fetched successfully');
      setGasStationData(data);
      setUserLocation({ lat, lng, name: locationName });
      
      // Save search state
      saveSearchState(lat, lng, locationName, radius);
      
    } catch (err) {
      handleFetchError(err, lat, lng, radius, locationName);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save search state to localStorage
   */
  const saveSearchState = useCallback((
    lat: number, 
    lng: number, 
    name: string, 
    radius: number
  ) => {
    const searchState: SearchState = {
      lat,
      lng,
      name,
      radius,
      timestamp: Date.now()
    };
    localStorage.setItem('lastGasStationSearch', JSON.stringify(searchState));
  }, []);

  /**
   * Handle fetch errors with fallback strategies
   */
  const handleFetchError = useCallback((
    err: unknown,
    lat: number,
    lng: number,
    radius: number,
    locationName: string
  ) => {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gas station data';
    console.error('Fetch error:', errorMessage);
    setError(errorMessage);
    
    // Try to load cached API response
    const cachedKey = `gas_stations_${lat}_${lng}_${radius}_${process.env.NEXT_PUBLIC_TANKERKOENIG_API_KEY || 'default'}`;
    const cached = localStorage.getItem(cachedKey);
    
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        console.log('Using cached API response');
        setGasStationData(data);
        setUserLocation({ lat, lng, name: locationName });
      } catch (cacheError) {
        console.error('Cache parse error:', cacheError);
      }
    }
  }, []);

  /**
   * Get user's current location
   */
  const getCurrentLocation = useCallback(() => {
    if (!geolocationSupported) {
      setError('Geolocation not supported');
      fetchGasStationsData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, radius, DEFAULT_LOCATION.name);
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchGasStationsData(latitude, longitude, radius, 'Your Current Location');
      },
      (geoError) => {
        console.warn('Geolocation error:', geoError);
        // Fallback to default location
        fetchGasStationsData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, radius, DEFAULT_LOCATION.name);
      },
      GEOLOCATION_CONFIG
    );
  }, [fetchGasStationsData, radius, geolocationSupported]);

  /**
   * Handle location search from child component
   */
  const handleLocationSearch = useCallback((location: UserLocation) => {
    fetchGasStationsData(location.lat, location.lng, radius, location.name);
  }, [fetchGasStationsData, radius]);

  /**
   * Handle radius change
   */
  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius);
    if (userLocation) {
      fetchGasStationsData(userLocation.lat, userLocation.lng, newRadius, userLocation.name);
    }
  }, [fetchGasStationsData, userLocation]);

  /**
   * Refresh current data
   */
  const refreshData = useCallback(() => {
    if (userLocation) {
      // Clear cache for this location before fetching
      const cacheKey = `gas_stations_${userLocation.lat}_${userLocation.lng}_${radius}_${process.env.NEXT_PUBLIC_TANKERKOENIG_API_KEY || 'default'}`;
      localStorage.removeItem(cacheKey);
      
      fetchGasStationsData(userLocation.lat, userLocation.lng, radius, userLocation.name);
    }
  }, [fetchGasStationsData, userLocation, radius]);

  /**
   * Initialize application
   */
  useEffect(() => {
    const initializeApp = () => {
      const savedSearch = localStorage.getItem('lastGasStationSearch');
      
      if (savedSearch) {
        try {
          const parsed: SearchState = JSON.parse(savedSearch);
          const { lat, lng, name, radius: savedRadius } = parsed;
          
          if (savedRadius) setRadius(savedRadius);
          fetchGasStationsData(lat, lng, savedRadius || radius, name);
          return;
        } catch (e) {
          console.error('Error parsing saved search:', e);
          localStorage.removeItem('lastGasStationSearch');
        }
      }
      
      // Try to get current location or use default
      getCurrentLocation();
    };

    initializeApp();
  }, []);

  // Loading component
  const renderLoading = () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <h2>Loading Gas Stations</h2>
      <p>Fetching the latest fuel prices in your area...</p>
      <p className="loading-details">
        Searching within {radius}km of {userLocation.name}
      </p>
    </div>
  );

  // Error component
  const renderError = () => (
    <div className="error-container">
      <div className="error-content">
        <h2>Unable to Load Data</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button 
            className="retry-btn"
            onClick={getCurrentLocation}
          >
            Try with Current Location
          </button>
          <button 
            className="default-btn"
            onClick={() => fetchGasStationsData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, radius, DEFAULT_LOCATION.name)}
          >
            Use Berlin, Germany
          </button>
        </div>
      </div>
    </div>
  );

  // Header controls component
  const renderHeaderControls = () => (
  <div className="app-header-controls">
    <div className="header-left">
      <h1 className="app-title">
        <span className="fuel-icon">⛽</span>
        FuelFinder
        <span className="beta-badge">BETA</span>
      </h1>
    </div>
    
    <div className="header-right">
      {userLocation && (
        <div className="location-info">
          <span className="location-name">{userLocation.name}</span>
          <span className="location-coords">
            ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
          </span>
        </div>
      )}
    </div>
  </div>
);


  // Footer component
  const renderFooter = () => (
    <div className="app-footer">
      <div className="footer-content">
        <div className="data-info">
          {gasStationData && (
            <>
              <span className="data-source">
                Data: {gasStationData.license || 'Tankerkönig API'}
              </span>
              <span className="data-status">
                Status: {gasStationData.status === 'ok' ? '✅ Live' : '⚠️ Limited'}
              </span>
              <span className="stations-count">
                Stations: {gasStationData.stations?.length || 0} found
              </span>
            </>
          )}
        </div>
        <div className="footer-actions">
          <button 
            className="footer-btn"
            onClick={refreshData}
          >
            Refresh Prices
          </button>
          <a 
            href="https://creativecommons.tankerkoenig.de/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-btn"
          >
            API Info
          </a>
        </div>
      </div>
    </div>
  );

  // Main render logic
  if (loading) return renderLoading();
  if (error && !gasStationData) return renderError();

  return (
    <div className="App">
      {renderHeaderControls()}
      
      {gasStationData && (
        <GasStationsList 
          data={gasStationData} 
          initialUserLocation={userLocation}
          onLocationSearch={handleLocationSearch}
          radius={radius}
          onRadiusChange={handleRadiusChange}
        />
      )}

      {renderFooter()}
    </div>
  );
};

export default App;