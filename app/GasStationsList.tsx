"use client";

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { 
  FaLocationArrow, 
  FaMapMarkerAlt, 
  FaGasPump, 
  FaSearch,
  FaRoute,
  FaMoneyBillWave,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaList,
  FaMap
} from 'react-icons/fa';
import axios from 'axios';

// Dynamically import the map component
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="map-placeholder">
      <div className="loading-spinner"></div>
    </div>
  )
});

// Type definitions
interface GasStation {
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

interface GasStationData {
  ok: boolean;
  license: string;
  data: string;
  status: string;
  stations: GasStation[];
}

interface GasStationCardProps {
  station: GasStation;
  onSelectStation?: (station: GasStation) => void;
  isSelected?: boolean;
  sortBy?: SortOption;
}

interface GasStationsListProps {
  data: GasStationData;
  initialUserLocation?: { lat: number; lng: number };
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

// Sorting types
type SortOption = 'distance' | 'price_diesel' | 'price_e5' | 'price_e10' | 'name';
type SortDirection = 'asc' | 'desc';

// Helper function to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Compact station card
const GasStationCard: React.FC<GasStationCardProps> = ({ 
  station, 
  onSelectStation,
  isSelected,
  sortBy
}) => {
  const handleCardClick = () => {
    if (onSelectStation) {
      onSelectStation(station);
    }
  };

  const getCheapestFuel = () => {
    const prices = [
      { type: 'diesel', value: station.diesel },
      { type: 'e5', value: station.e5 },
      { type: 'e10', value: station.e10 }
    ];
    return prices.reduce((cheapest, current) => 
      current.value < cheapest.value ? current : cheapest
    );
  };

  const cheapest = getCheapestFuel();

  return (
    <div 
      className={`station-card ${station.isOpen ? 'open' : 'closed'} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      <div className="card-header">
        <div className="station-name">
          <h3>{station.name}</h3>
          <span className={`status ${station.isOpen ? 'open' : 'closed'}`}>
            {station.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <div className="brand">{station.brand}</div>
      </div>

      <div className="card-content">
        <div className="location">
          <FaMapMarkerAlt className="icon-sm" />
          <span>{station.dist.toFixed(1)} km • {station.place}</span>
        </div>
        
        <div className="prices-compact">
          <div className="price-row">
            <span className="fuel-type">Diesel</span>
            <span className={`price ${sortBy === 'price_diesel' ? 'highlight' : ''}`}>
              €{station.diesel.toFixed(3)}
            </span>
          </div>
          <div className="price-row">
            <span className="fuel-type">E5</span>
            <span className={`price ${sortBy === 'price_e5' ? 'highlight' : ''}`}>
              €{station.e5.toFixed(3)}
            </span>
          </div>
          <div className="price-row">
            <span className="fuel-type">E10</span>
            <span className={`price ${sortBy === 'price_e10' ? 'highlight' : ''}`}>
              €{station.e10.toFixed(3)}
            </span>
          </div>
        </div>

        <div className="cheapest-badge">
          <FaMoneyBillWave className="icon-sm" />
          <span>Best: {cheapest.type.toUpperCase()} €{cheapest.value.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
};

// Compact search component
const LocationSearch: React.FC<{
  onLocationFound: (location: { lat: number; lng: number; name: string }) => void;
  currentLocation?: { lat: number; lng: number };
}> = ({ onLocationFound, currentLocation }) => {
  const [zipCode, setZipCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) {
      setError('Enter zip code');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zipCode)}&countrycodes=de&limit=1`
      );

      if (response.data.length === 0) {
        setError('Location not found');
        return;
      }

      const location = response.data[0];
      onLocationFound({
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
        name: location.display_name
      });
    } catch (err) {
      setError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      onLocationFound({
        ...currentLocation,
        name: 'Current Location'
      });
    }
  };

  return (
    <div className="search-compact">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input">
          <FaSearch className="icon" />
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter zip code"
            maxLength={10}
          />
          <button 
            type="submit" 
            className="search-btn"
            disabled={isSearching || !zipCode.trim()}
          >
            {isSearching ? '...' : 'Go'}
          </button>
        </div>
        {error && <div className="search-error">{error}</div>}
      </form>
      <button 
        onClick={handleUseCurrentLocation}
        className="location-btn"
      >
        <FaLocationArrow className="icon" />
        My Location
      </button>
    </div>
  );
};

// Main component
const GasStationsList: React.FC<GasStationsListProps> = ({ data, initialUserLocation }) => {
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string } | undefined>(initialUserLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  
  // Sorting states
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location'
        };
        setUserLocation(location);
        setSearchedLocation(null);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Handle zip code location found
  const handleZipCodeLocationFound = (location: { lat: number; lng: number; name: string }) => {
    setSearchedLocation(location);
    setUserLocation(location);
  };

  // Initialize
  useEffect(() => {
    setIsClient(true);
    if (!initialUserLocation && !searchedLocation) {
      getUserLocation();
    }
  }, [getUserLocation, initialUserLocation, searchedLocation]);

  // Validate data
  if (!data.ok || data.status !== 'ok' || !Array.isArray(data.stations)) {
    return (
      <div className="error">
        <h2>Error Loading Data</h2>
        <p>Unable to retrieve gas station information.</p>
      </div>
    );
  }

  // Calculate distances
  const stationsWithDistances = data.stations.map(station => {
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        station.lat,
        station.lng
      );
      return { ...station, dist: distance };
    }
    return station;
  });

  // Filter and sort
  let filteredStations = [...stationsWithDistances];
  
  if (showOnlyOpen) {
    filteredStations = filteredStations.filter(station => station.isOpen);
  }

  const sortedStations = [...filteredStations].sort((a, b) => {
    let valueA: number | string;
    let valueB: number | string;

    switch (sortBy) {
      case 'distance':
        valueA = a.dist;
        valueB = b.dist;
        break;
      case 'price_diesel':
        valueA = a.diesel;
        valueB = b.diesel;
        break;
      case 'price_e5':
        valueA = a.e5;
        valueB = b.e5;
        break;
      case 'price_e10':
        valueA = a.e10;
        valueB = b.e10;
        break;
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      default:
        valueA = a.dist;
        valueB = b.dist;
    }

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    } else {
      return sortDirection === 'asc' 
        ? valueA.localeCompare(valueB as string)
        : (valueB as string).localeCompare(valueA);
    }
  });

  const openStationsCount = sortedStations.filter(s => s.isOpen).length;

  // Sort options
  const sortOptions = [
    { value: 'distance', label: 'Distance', icon: FaRoute },
    { value: 'price_diesel', label: 'Diesel', icon: FaMoneyBillWave },
    { value: 'price_e5', label: 'E5', icon: FaMoneyBillWave },
    { value: 'price_e10', label: 'E10', icon: FaMoneyBillWave },
    { value: 'name', label: 'Name', icon: FaGasPump },
  ] as const;

  return (
    <div className="gas-stations-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <h1>
            <FaGasPump className="icon" />
            <span>Gas Stations</span>
          </h1>
          <div className="header-actions">
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <FaList />
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="Map View"
              >
                <FaMap />
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="search-section">
          <LocationSearch 
            onLocationFound={handleZipCodeLocationFound}
            currentLocation={userLocation}
          />
        </div>

        {/* Location info */}
        <div className="location-info">
          {userLocation ? (
            <div className="location-active">
              <FaMapMarkerAlt className="icon" />
              <span>{userLocation.name}</span>
              <button 
                onClick={getUserLocation}
                className="refresh-btn"
                disabled={isLocating}
              >
                <FaLocationArrow className="icon-sm" />
              </button>
            </div>
          ) : (
            <div className="location-loading">
              <div className="spinner-small"></div>
              <span>Getting location...</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">{sortedStations.length}</span>
            <span className="stat-label">Stations</span>
          </div>
          <div className="stat">
            <span className="stat-value">{openStationsCount}</span>
            <span className="stat-label">Open</span>
          </div>
          {sortBy.startsWith('price_') && sortedStations[0] && (
            <div className="stat">
              <span className="stat-value">
                €{sortedStations[0][sortBy.split('_')[1] as keyof GasStation]?.toFixed(3)}
              </span>
              <span className="stat-label">Best Price</span>
            </div>
          )}
        </div>
      </header>

      {/* Controls */}
      <div className="controls-bar">
        <div className="sort-controls">
          <div className="sort-buttons">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  className={`sort-btn ${sortBy === option.value ? 'active' : ''}`}
                  onClick={() => setSortBy(option.value)}
                  title={`Sort by ${option.label}`}
                >
                  <Icon className="icon-sm" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
          <button
            className={`direction-btn ${sortDirection}`}
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortDirection === 'asc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
          </button>
        </div>
        
        <button
          className={`filter-btn ${showOnlyOpen ? 'active' : ''}`}
          onClick={() => setShowOnlyOpen(!showOnlyOpen)}
          title={showOnlyOpen ? 'Show all stations' : 'Show only open stations'}
        >
          <FaFilter className="icon-sm" />
          <span>Open Only</span>
          {showOnlyOpen && <span className="filter-dot"></span>}
        </button>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {viewMode === 'map' && isClient ? (
          <div className="map-container">
            <MapView 
              stations={sortedStations}
              selectedStation={selectedStation}
              userLocation={userLocation}
              onStationSelect={setSelectedStation}
              searchedLocation={searchedLocation}
            />
          </div>
        ) : (
          <div className="stations-list">
            {sortedStations.length === 0 ? (
              <div className="empty-state">
                <FaGasPump className="icon-lg" />
                <p>No stations found</p>
                {showOnlyOpen && <p>Try turning off "Open Only" filter</p>}
              </div>
            ) : (
              sortedStations.map((station) => (
                <GasStationCard 
                  key={station.id} 
                  station={station}
                  onSelectStation={setSelectedStation}
                  isSelected={selectedStation?.id === station.id}
                  sortBy={sortBy}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* Selected Station Details */}
      {selectedStation && (
        <div className="selected-details">
          <div className="details-header">
            <h3>{selectedStation.name}</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedStation(null)}
            >
              ×
            </button>
          </div>
          <div className="details-content">
            <div className="detail-row">
              <span className="label">Address:</span>
              <span>{selectedStation.street} {selectedStation.houseNumber}, {selectedStation.place}</span>
            </div>
            <div className="detail-row">
              <span className="label">Distance:</span>
              <span>{selectedStation.dist.toFixed(1)} km</span>
            </div>
            <div className="detail-row">
              <span className="label">Prices:</span>
              <div className="price-tags">
                <span className="price-tag">Diesel €{selectedStation.diesel.toFixed(3)}</span>
                <span className="price-tag">E5 €{selectedStation.e5.toFixed(3)}</span>
                <span className="price-tag">E10 €{selectedStation.e10.toFixed(3)}</span>
              </div>
            </div>
            {userLocation && (
              <a 
                href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${selectedStation.lat},${selectedStation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="directions-btn"
              >
                <FaRoute className="icon-sm" />
                Get Directions
              </a>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p className="footer-text">
          Data: {data.data} • Map: OpenStreetMap
        </p>
      </footer>
    </div>
  );
};

export default GasStationsList;