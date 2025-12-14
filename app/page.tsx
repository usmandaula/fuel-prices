"use client"
import React, { useState, useEffect, useCallback } from 'react';
import GasStationsList from './GasStationsList';
import './GasStationsList.css';
import { fetchGasStations } from './services/gasStationService';

// Default location (Berlin)
const DEFAULT_LOCATION = {
  lat: 52.521,
  lng: 13.438,
  name: 'Berlin, Germany'
};

const App: React.FC = () => {
  const [gasStationData, setGasStationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string }>(DEFAULT_LOCATION);
  const [radius, setRadius] = useState<number>(5); // Default radius in km

  // Function to fetch gas station data
  const fetchGasStationsData = useCallback(async (lat: number, lng: number, radius: number, locationName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching gas stations for: ${lat}, ${lng} with radius ${radius}km`);
      
      // Use the API service to fetch data
      const data = await fetchGasStations(lat, lng, radius);
      
      console.log('Data fetched successfully:', data);
      setGasStationData(data);
      setUserLocation({ lat, lng, name: locationName });
      
      // Save to localStorage for persistence
      localStorage.setItem('lastGasStationSearch', JSON.stringify({
        lat,
        lng,
        name: locationName,
        radius,
        timestamp: Date.now()
      }));
      
    } catch (err) {
      console.error('Error fetching gas stations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch gas station data. Please try again.');
      
      // Try to load cached data as fallback
      const cached = localStorage.getItem('gasStationsCache');
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          console.log('Using cached data as fallback');
          setGasStationData(cachedData);
        } catch (cacheError) {
          console.error('Error parsing cached data:', cacheError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      fetchGasStationsData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, radius, DEFAULT_LOCATION.name);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchGasStationsData(latitude, longitude, radius, 'Your Current Location');
      },
      (error) => {
        console.warn('Geolocation error:', error);
        // Fallback to default location
        fetchGasStationsData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, radius, DEFAULT_LOCATION.name);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [fetchGasStationsData, radius]);

  // Handle location search from child component
  const handleLocationSearch = (location: { lat: number; lng: number; name: string }) => {
    fetchGasStationsData(location.lat, location.lng, radius, location.name);
  };

  // Handle radius change
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (userLocation) {
      fetchGasStationsData(userLocation.lat, userLocation.lng, newRadius, userLocation.name);
    }
  };

  // Refresh data
  const refreshData = () => {
    if (userLocation) {
      fetchGasStationsData(userLocation.lat, userLocation.lng, radius, userLocation.name);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    // Check for saved location
    const savedSearch = localStorage.getItem('lastGasStationSearch');
    if (savedSearch) {
      try {
        const { lat, lng, name, radius: savedRadius } = JSON.parse(savedSearch);
        if (savedRadius) setRadius(savedRadius);
        fetchGasStationsData(lat, lng, savedRadius || radius, name);
        return;
      } catch (e) {
        console.error('Error parsing saved search:', e);
      }
    }
    
    // Try to get current location or use default
    getCurrentLocation();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading Gas Stations</h2>
        <p>Fetching the latest fuel prices in your area...</p>
        <p className="loading-details">
          Searching within {radius}km of {userLocation.name}
        </p>
      </div>
    );
  }

  // Error state
  if (error && !gasStationData) {
    return (
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
  }

  // Render main app
  return (
    <div className="App">
      {/* Header Controls */}
      <div className="app-header-controls">
        <div className="header-left">
          <h1 className="app-title">
            <span className="fuel-icon">⛽</span>
            FuelFinder
            <span className="beta-badge">BETA</span>
          </h1>
          {userLocation && (
            <div className="location-info">
              <span className="location-name">{userLocation.name}</span>
              <span className="location-coords">
                ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
              </span>
            </div>
          )}
        </div>
        
        <div className="header-right">
          <div className="radius-selector">
            <label>Search Radius: {radius}km</label>
            <div className="radius-buttons">
              {[1, 3, 5, 10, 15, 25].map((r) => (
                <button
                  key={r}
                  className={`radius-btn ${radius === r ? 'active' : ''}`}
                  onClick={() => handleRadiusChange(r)}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="action-btn refresh-btn"
              onClick={refreshData}
              title="Refresh prices"
            >
              🔄 Refresh
            </button>
            <button 
              className="action-btn location-btn"
              onClick={getCurrentLocation}
              title="Use current location"
            >
              📍 My Location
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {gasStationData && (
        <GasStationsList 
          data={gasStationData} 
          initialUserLocation={userLocation}
          onLocationSearch={handleLocationSearch}
        />
      )}

      {/* Footer */}
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
    </div>
  );
};

export default App;