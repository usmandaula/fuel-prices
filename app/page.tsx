"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  const [userLocation, setUserLocation] =
    useState<UserLocation>(DEFAULT_LOCATION);
  const [radius, setRadius] = useState<number>(5);

  // Memoized values
  const geolocationSupported = useMemo(
    () => typeof navigator !== "undefined" && "geolocation" in navigator,
    []
  );

  /**
   * Save search state (SAFE)
   */
  const saveSearchState = useCallback((state: SearchState) => {
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
      setLoading(true);
      setError(null);

      try {
        const data = await fetchGasStationsCached(lat, lng, radius);

        setGasStationData(data);
        setUserLocation({ lat, lng, name: locationName });

        // ✅ Save ONLY valid state
        if (
          typeof lat === "number" &&
          typeof lng === "number" &&
          typeof radius === "number" &&
          locationName
        ) {
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
useEffect(() => {
  const savedSearch = localStorage.getItem("lastGasStationSearch");

  if (savedSearch && savedSearch !== "undefined") {
    try {
      const parsed: SearchState = JSON.parse(savedSearch);

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
        return; // ✅ stop here if restored
      }
    } catch {
      localStorage.removeItem("lastGasStationSearch");
    }
  }

  // ✅ fallback ONLY if no valid saved state
  getCurrentLocation();
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
          radius={radius}
          onRadiusChange={(r) => {
            if (r === radius) return;
            setRadius(r);
            fetchGasStationsData(
              userLocation.lat,
              userLocation.lng,
              r,
              userLocation.name
            );
          }}
        />
      )}
    </div>
  );
};

export default App;
