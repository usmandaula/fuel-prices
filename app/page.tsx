"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import GasStationsList from "./GasStationsList";
import "./GasStationsList.css";
import { fetchGasStationsCached } from "./services/gasStationService";

// Constants
const DEFAULT_LOCATION = {
  lat: 52.521,
  lng: 13.438,
  name: "Berlin, Germany",
} as const;

const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
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
  const [radius, setRadius] = useState<number>(5);

  // Refs for debugging
  const renderCount = useRef(0);
  const radiusUpdateCount = useRef(0);

  // Track renders
  useEffect(() => {
    renderCount.current += 1;
    console.log(`🔄 App render #${renderCount.current}`, {
      radius,
      userLocation: userLocation.name,
      loading,
      time: Date.now()
    });
  });

  // Track radius state changes
  useEffect(() => {
    radiusUpdateCount.current += 1;
    console.log(`📏 RADIUS STATE UPDATE #${radiusUpdateCount.current}:`, {
      value: radius,
      source: 'state',
      time: Date.now()
    });
  }, [radius]);

  // Memoized values
  const geolocationSupported = useMemo(
    () => typeof navigator !== "undefined" && "geolocation" in navigator,
    []
  );

  /**
   * Save search state (SAFE)
   */
  const saveSearchState = useCallback((state: SearchState) => {
    console.log('💾 Saving to localStorage:', { radius: state.radius });
    localStorage.setItem(
      "lastGasStationSearch",
      JSON.stringify(state)
    );
  }, []);

  /**
   * Fetch gas station data
   */
  const fetchGasStationsData = useCallback(
    async (lat: number, lng: number, radius: number, locationName: string) => {
      console.log('📡 API CALL:', { lat, lng, radius, locationName });
      
      setLoading(true);
      setError(null);

      try {
        const data = await fetchGasStationsCached(lat, lng, radius);
        
        if (data.status === 'ok' && data.stations && data.stations.length > 0) {
          setGasStationData(data);
          setUserLocation({ lat, lng, name: locationName });
        } else {
          setGasStationData(data);
          setUserLocation({ lat, lng, name: locationName });
          setError(`No gas stations found within ${radius}km radius`);
        }

        // Save state
        if (lat && lng && radius && locationName) {
          saveSearchState({
            lat,
            lng,
            name: locationName,
            radius,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        handleFetchError(err, lat, lng, radius, locationName);
      } finally {
        setLoading(false);
      }
    },
    [saveSearchState]
  );

  /**
   * Handle location search
   */
  const handleLocationSearch = useCallback((location: UserLocation) => {
    console.log('📍 handleLocationSearch:', location.name);
    fetchGasStationsData(location.lat, location.lng, radius, location.name);
  }, [radius, fetchGasStationsData]);

  /**
   * Handle radius change - FIXED VERSION
   * Using refs to avoid stale closures
   */
  const radiusRef = useRef(radius);
  const userLocationRef = useRef(userLocation);

  // Update refs when state changes
  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const handleRadiusChange = useCallback((newRadius: number) => {
    console.log('🎯 handleRadiusChange called with refs:', {
      newRadius,
      currentRef: radiusRef.current,
      location: userLocationRef.current.name
    });
    
    // Use ref for comparison, not state (to avoid stale closure)
    if (newRadius === radiusRef.current) {
      console.log('⚠️ Same radius, skipping');
      return;
    }
    
    // Update state
    setRadius(newRadius);
    
    // Update ref immediately
    radiusRef.current = newRadius;
    
    // Fetch data
    fetchGasStationsData(
      userLocationRef.current.lat,
      userLocationRef.current.lng,
      newRadius,
      userLocationRef.current.name
    );
  }, [fetchGasStationsData]); // Only depends on fetchGasStationsData

  /**
   * Tracked setRadius for debugging
   */
  const trackedSetRadius = useCallback((newRadius: number) => {
    console.log('🎯 trackedSetRadius called:', newRadius);
    setRadius(newRadius);
  }, []);

  /**
   * Handle fetch errors with cache fallback
   */
  const handleFetchError = useCallback(
    (
      err: unknown,
      lat: number,
      lng: number,
      radius: number,
      locationName: string
    ) => {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch gas station data";

      setError(errorMessage);

      const cacheKey = `gas_stations_${lat}_${lng}_${radius}_${
        process.env.NEXT_PUBLIC_TANKERKOENIG_API_KEY || "default"
      }`;

      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          setGasStationData(data);
          setUserLocation({ lat, lng, name: locationName });
        } catch {
          // ignore corrupted cache
        }
      }
    },
    []
  );

  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(() => {
    if (!geolocationSupported) {
      fetchGasStationsData(
        DEFAULT_LOCATION.lat,
        DEFAULT_LOCATION.lng,
        radius,
        DEFAULT_LOCATION.name
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchGasStationsData(
          position.coords.latitude,
          position.coords.longitude,
          radius,
          "Your Current Location"
        );
      },
      () => {
        fetchGasStationsData(
          DEFAULT_LOCATION.lat,
          DEFAULT_LOCATION.lng,
          radius,
          DEFAULT_LOCATION.name
        );
      },
      GEOLOCATION_CONFIG
    );
  }, [fetchGasStationsData, radius, geolocationSupported]);

  /**
   * Initialize app
   */
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (hasInitialized.current) return;
    
    const savedSearch = localStorage.getItem("lastGasStationSearch");
    console.log('🚀 Initialization, saved search:', savedSearch);

    if (savedSearch && savedSearch !== "undefined") {
      try {
        const parsed: SearchState = JSON.parse(savedSearch);
        console.log('📋 Restoring from localStorage:', parsed.radius);

        if (
          typeof parsed.lat === "number" &&
          typeof parsed.lng === "number" &&
          typeof parsed.radius === "number" &&
          typeof parsed.name === "string"
        ) {
          setRadius(parsed.radius);
          fetchGasStationsData(
            parsed.lat,
            parsed.lng,
            parsed.radius,
            parsed.name
          );
          hasInitialized.current = true;
          return;
        }
      } catch {
        localStorage.removeItem("lastGasStationSearch");
      }
    }

    console.log('📍 Getting current location...');
    getCurrentLocation();
    hasInitialized.current = true;
  }, [fetchGasStationsData, getCurrentLocation]);

  // UI states
  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading Gas Stations</h2>
      </div>
    );
  }

  if (error && !gasStationData) {
    return (
      <div className="error-container">
        <h2>Unable to Load Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-header-controls">
        <h1 className="app-title">
          <span className="fuel-icon">⛽</span>
          FuelFinder <span className="beta-badge">BETA</span>
        </h1>
        
        {/* <div className="direct-test-buttons" style={{
          border: '2px solid red',
          padding: '10px',
          margin: '10px',
          backgroundColor: '#fff3cd'
        }}>
          <h4>🎯 Direct State Test</h4>
          <p>Current radius in App state: <strong>{radius}</strong>km</p>
          <div>
            <button onClick={() => {
              console.log('🧪 DIRECT CLICK: Setting radius to 5');
              trackedSetRadius(5);
            }}>Set to 5</button>
            
            <button onClick={() => {
              console.log('🧪 DIRECT CLICK: Setting radius to 10');
              trackedSetRadius(10);
            }}>Set to 10</button>
            
            <button onClick={() => {
              console.log('🧪 DIRECT CLICK: Setting radius to 15');
              trackedSetRadius(15);
            }}>Set to 15</button>
          </div>
          
          <button onClick={() => {
            console.log('📋 Current App State:', {
              radius,
              userLocation: userLocation.name,
              renderCount: renderCount.current
            });
          }}>
            Log App State
          </button>
        </div>
        
        <div className="test-buttons">
          <button onClick={() => {
            const saved = localStorage.getItem("lastGasStationSearch");
            console.log('📋 localStorage lastGasStationSearch:', saved);
            if (saved) {
              console.log('📋 Parsed:', JSON.parse(saved));
            }
          }}>
            Check localStorage
          </button>
        </div> */}
        
        <div className="location-info">
          <span>{userLocation.name}</span>
          <span>
            ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
          </span>
        </div>
      </div>

      {gasStationData && (
        <GasStationsList
          data={gasStationData}
          initialUserLocation={userLocation}
          onLocationSearch={handleLocationSearch} 
          radius={radius}
          onRadiusChange={handleRadiusChange}
        />
      )}
    </div>
  );
};

export default App;