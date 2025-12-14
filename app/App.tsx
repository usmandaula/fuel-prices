"use client";

import React, { useState, useEffect, useCallback } from 'react';
import GasStationsList, { GasStationData } from './GasStationsList';
import './GasStationsList.css';
import { fetchGasStations } from './services/gasStationService';
import { FaGasPump, FaExclamationTriangle, FaSpinner, FaLocationArrow, FaSync, FaMapMarkerAlt } from 'react-icons/fa';

const App: React.FC = () => {
  const [gasStationData, setGasStationData] = useState<GasStationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(1.5);

  // Default location (Berlin)
  const defaultLocation = { lat: 52.521, lng: 13.438 };

  // Fetch gas stations
  const fetchStations = useCallback(async (lat: number, lng: number, radius: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchGasStations(lat, lng, radius, {
        sort: 'dist',
        fuelType: 'all',
        includeClosed: false
      });
      setGasStationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gas stations');
      console.error('Error fetching gas stations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setUseCurrentLocation(false);
      fetchStations(defaultLocation.lat, defaultLocation.lng, searchRadius);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        fetchStations(location.lat, location.lng, searchRadius);
        setUseCurrentLocation(true);
      },
      (locationError) => {
        let errorMessage = 'Failed to get location: ';
        switch (locationError.code) {
          case locationError.PERMISSION_DENIED:
            errorMessage += 'Permission denied. Please allow location access.';
            break;
          case locationError.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case locationError.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Unknown error.';
        }
        setError(errorMessage);
        
        // Fallback to default location
        fetchStations(defaultLocation.lat, defaultLocation.lng, searchRadius);
        setUseCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [fetchStations, searchRadius]);

  // Initial load
  useEffect(() => {
    if (useCurrentLocation) {
      getUserLocation();
    } else {
      fetchStations(defaultLocation.lat, defaultLocation.lng, searchRadius);
    }
  }, [useCurrentLocation, searchRadius]);

  // Handle refresh
  const handleRefresh = () => {
    if (useCurrentLocation && userLocation) {
      fetchStations(userLocation.lat, userLocation.lng, searchRadius);
    } else {
      fetchStations(defaultLocation.lat, defaultLocation.lng, searchRadius);
    }
  };

  // Handle use current location
  const handleUseCurrentLocation = () => {
    setUseCurrentLocation(true);
    getUserLocation();
  };

  // Handle use default location
  const handleUseDefaultLocation = () => {
    setUseCurrentLocation(false);
    setUserLocation(null);
    fetchStations(defaultLocation.lat, defaultLocation.lng, searchRadius);
  };

  // Loading state
  if (loading && !gasStationData) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <FaSpinner className="loading-spinner" />
          <h2>Loading Gas Stations...</h2>
          <p>Fetching the latest fuel prices in your area</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !gasStationData) {
    return (
      <div className="app-error">
        <div className="error-content">
          <FaExclamationTriangle className="error-icon" />
          <h2>Unable to Load Data</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="retry-btn" onClick={handleRefresh}>
              <FaSync />
              Try Again
            </button>
            <button className="location-btn" onClick={handleUseDefaultLocation}>
              <FaGasPump />
              Use Berlin (Default)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!gasStationData) {
    return (
      <div className="app-error">
        <div className="error-content">
          <FaExclamationTriangle className="error-icon" />
          <h2>No Data Available</h2>
          <p>Unable to load gas station data. Please try again.</p>
          <div className="error-actions">
            <button className="retry-btn" onClick={handleRefresh}>
              <FaSync />
              Retry
            </button>
            <button className="location-btn" onClick={handleUseCurrentLocation}>
              <FaLocationArrow />
              Use My Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* App Header with Controls */}
      <div className="app-controls">
        <div className="controls-left">
          <div className="location-info">
            <FaMapMarkerAlt className="location-icon" />
            <div className="location-text">
              <span className="location-name">
                {useCurrentLocation && userLocation ? 'Current Location' : 'Berlin, Germany'}
              </span>
              <span className="location-coords">
                {userLocation ? 
                  `${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}` : 
                  '52.521, 13.438'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="controls-center">
          <div className="radius-control">
            <label htmlFor="radius-slider">Search Radius: {searchRadius} km</label>
            <input
              id="radius-slider"
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
              className="radius-slider"
            />
            <div className="radius-markers">
              <span>0.5 km</span>
              <span>2.5 km</span>
              <span>5 km</span>
            </div>
          </div>
        </div>
        
        <div className="controls-right">
          <div className="action-buttons">
            <button 
              className={`location-toggle ${useCurrentLocation ? 'active' : ''}`}
              onClick={handleUseCurrentLocation}
              title="Use my current location"
            >
              <FaLocationArrow />
              <span>My Location</span>
            </button>
            <button 
              className={`location-toggle ${!useCurrentLocation ? 'active' : ''}`}
              onClick={handleUseDefaultLocation}
              title="Use Berlin (default)"
            >
              <FaGasPump />
              <span>Berlin</span>
            </button>
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh data"
            >
              <FaSync className={loading ? 'spinning' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="stats-banner">
        <div className="stats-content">
          <div className="stat-item">
            <span className="stat-value">{gasStationData.stations.length}</span>
            <span className="stat-label">Stations Found</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {gasStationData.stations.filter(s => s.isOpen).length}
            </span>
            <span className="stat-label">Open Now</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              €{(gasStationData.stations.reduce((sum, s) => sum + s.diesel, 0) / gasStationData.stations.length).toFixed(3)}
            </span>
            <span className="stat-label">Avg Diesel</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              €{(gasStationData.stations.reduce((sum, s) => sum + s.e5, 0) / gasStationData.stations.length).toFixed(3)}
            </span>
            <span className="stat-label">Avg E5</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              €{(gasStationData.stations.reduce((sum, s) => sum + s.e10, 0) / gasStationData.stations.length).toFixed(3)}
            </span>
            <span className="stat-label">Avg E10</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading && gasStationData && (
        <div className="refreshing-overlay">
          <FaSpinner className="spinning" />
          <span>Updating prices...</span>
        </div>
      )}

      <GasStationsList 
        data={gasStationData} 
        initialUserLocation={userLocation || undefined}
      />
    </div>
  );
};

export default App;