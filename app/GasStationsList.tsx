"use client";

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { 
  FaLocationArrow, 
  FaMapMarkerAlt, 
  FaGasPump, 
  FaSearch, 
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaRoute,
  FaMoneyBillWave,
  FaFilter
} from 'react-icons/fa';
import axios from 'axios';

// Dynamically import the map component to avoid SSR issues
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="map-placeholder">
      <div className="loading-spinner"></div>
      <p>Loading map...</p>
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
  priceType?: FuelType;
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

// Sorting and filtering types
type SortOption = 'distance' | 'price_diesel' | 'price_e5' | 'price_e10' | 'name' | 'brand';
type SortDirection = 'asc' | 'desc';
type FuelType = 'diesel' | 'e5' | 'e10' | 'all';

// Helper function to calculate distance between two coordinates (Haversine formula)
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

// Sorting and filtering component
const SortFilterControls: React.FC<{
  sortBy: SortOption;
  sortDirection: SortDirection;
  priceType: FuelType;
  showOnlyOpen: boolean;
  onSortChange: (sortBy: SortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onPriceTypeChange: (type: FuelType) => void;
  onShowOnlyOpenChange: (show: boolean) => void;
}> = ({
  sortBy,
  sortDirection,
  priceType,
  showOnlyOpen,
  onSortChange,
  onSortDirectionChange,
  onPriceTypeChange,
  onShowOnlyOpenChange
}) => {
  const sortOptions = [
    { value: 'distance', label: 'Distance', icon: FaRoute },
    { value: 'price_diesel', label: 'Diesel Price', icon: FaMoneyBillWave },
    { value: 'price_e5', label: 'E5 Price', icon: FaMoneyBillWave },
    { value: 'price_e10', label: 'E10 Price', icon: FaMoneyBillWave },
    { value: 'name', label: 'Station Name', icon: FaGasPump },
    { value: 'brand', label: 'Brand', icon: FaGasPump },
  ] as const;

  const fuelTypes = [
    { value: 'all', label: 'All Fuels', icon: FaGasPump },
    { value: 'diesel', label: 'Diesel', icon: FaGasPump },
    { value: 'e5', label: 'E5', icon: FaGasPump },
    { value: 'e10', label: 'E10', icon: FaGasPump },
  ] as const;

  const SortIcon = sortDirection === 'asc' ? FaSortUp : FaSortDown;

  return (
    <div className="sort-filter-container">
      <div className="controls-header">
        <FaSort className="icon" />
        <h3>Sort & Filter</h3>
      </div>
      
      <div className="controls-grid">
        {/* Sort by selection */}
        <div className="control-group">
          <label className="control-label">
            <FaSort className="icon" /> Sort By:
          </label>
          <div className="sort-options">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                  onClick={() => onSortChange(option.value)}
                >
                  <Icon className="icon" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort direction */}
        <div className="control-group">
          <label className="control-label">
            <SortIcon className="icon" /> Order:
          </label>
          <div className="direction-options">
            <button
              type="button"
              className={`direction-option ${sortDirection === 'asc' ? 'active' : ''}`}
              onClick={() => onSortDirectionChange('asc')}
            >
              <FaSortUp className="icon" />
              {sortBy.startsWith('price_') ? 'Low to High' : 'A to Z'}
            </button>
            <button
              type="button"
              className={`direction-option ${sortDirection === 'desc' ? 'active' : ''}`}
              onClick={() => onSortDirectionChange('desc')}
            >
              <FaSortDown className="icon" />
              {sortBy.startsWith('price_') ? 'High to Low' : 'Z to A'}
            </button>
          </div>
        </div>

        {/* Price type filter */}
        <div className="control-group">
          <label className="control-label">
            <FaMoneyBillWave className="icon" /> Show Prices For:
          </label>
          <div className="price-type-options">
            {fuelTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  className={`price-type-option ${priceType === type.value ? 'active' : ''}`}
                  onClick={() => onPriceTypeChange(type.value)}
                >
                  <Icon className="icon" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Open stations filter */}
        <div className="control-group">
          <label className="control-label">
            <FaFilter className="icon" /> Filter:
          </label>
          <div className="filter-options">
            <button
              type="button"
              className={`filter-option ${showOnlyOpen ? 'active' : ''}`}
              onClick={() => onShowOnlyOpenChange(!showOnlyOpen)}
            >
              <div className={`toggle-switch ${showOnlyOpen ? 'on' : 'off'}`}>
                <div className="toggle-slider"></div>
              </div>
              Show Only Open Stations
              {showOnlyOpen && (
                <span className="filter-badge">
                  <FaGasPump className="icon" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual gas station card component with price highlighting
const GasStationCard: React.FC<GasStationCardProps> = ({ 
  station, 
  onSelectStation,
  isSelected,
  sortBy,
  priceType
}) => {
  const handleCardClick = () => {
    if (onSelectStation) {
      onSelectStation(station);
    }
  };

  // Determine which price to highlight based on sort/filter
  const getHighlightedPrice = () => {
    if (!sortBy || !sortBy.startsWith('price_')) return null;
    
    switch (sortBy) {
      case 'price_diesel':
        return { type: 'Diesel', price: station.diesel, isHighlighted: true };
      case 'price_e5':
        return { type: 'E5', price: station.e5, isHighlighted: true };
      case 'price_e10':
        return { type: 'E10', price: station.e10, isHighlighted: true };
      default:
        return null;
    }
  };

  const highlightedPrice = getHighlightedPrice();

  return (
    <div 
      className={`gas-station-card ${station.isOpen ? 'open' : 'closed'} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: onSelectStation ? 'pointer' : 'default' }}
    >
      <div className="station-header">
        <h3>{station.name}</h3>
        <div className="header-right">
          <span className={`status-badge ${station.isOpen ? 'open' : 'closed'}`}>
            {station.isOpen ? (
              <>
                <FaGasPump className="icon" /> Open
              </>
            ) : (
              'Closed'
            )}
          </span>
          {isSelected && (
            <span className="selected-badge">
              <FaMapMarkerAlt className="icon" /> Selected
            </span>
          )}
        </div>
      </div>
      
      <div className="brand-info">
        <FaGasPump className="icon" />
        <strong>Brand:</strong> {station.brand}
      </div>
      
      <div className="address">
        <div><strong>Address:</strong></div>
        <div>{station.street} {station.houseNumber}</div>
        <div>{station.postCode} {station.place}</div>
      </div>
      
      <div className="coordinates">
        <div>
          <strong>Location:</strong> {station.lat.toFixed(6)}, {station.lng.toFixed(6)}
        </div>
        <div className="distance">
          <strong>Distance:</strong> {station.dist.toFixed(1)} km
          {sortBy === 'distance' && (
            <span className="sort-indicator">
              <FaRoute className="icon" />
            </span>
          )}
        </div>
      </div>
      
      <div className="prices">
        <h4>
          <FaGasPump className="icon" /> Fuel Prices
        </h4>
        <div className="price-grid">
          <div className={`price-item ${priceType === 'diesel' || priceType === 'all' ? 'active' : ''} ${highlightedPrice?.type === 'Diesel' ? 'highlighted' : ''}`}>
            <span className="fuel-type">
              Diesel
              {sortBy === 'price_diesel' && (
                <span className="sort-indicator">
                  <FaMoneyBillWave className="icon" />
                </span>
              )}
            </span>
            <span className="price">€{station.diesel.toFixed(3)}</span>
          </div>
          <div className={`price-item ${priceType === 'e5' || priceType === 'all' ? 'active' : ''} ${highlightedPrice?.type === 'E5' ? 'highlighted' : ''}`}>
            <span className="fuel-type">
              E5
              {sortBy === 'price_e5' && (
                <span className="sort-indicator">
                  <FaMoneyBillWave className="icon" />
                </span>
              )}
            </span>
            <span className="price">€{station.e5.toFixed(3)}</span>
          </div>
          <div className={`price-item ${priceType === 'e10' || priceType === 'all' ? 'active' : ''} ${highlightedPrice?.type === 'E10' ? 'highlighted' : ''}`}>
            <span className="fuel-type">
              E10
              {sortBy === 'price_e10' && (
                <span className="sort-indicator">
                  <FaMoneyBillWave className="icon" />
                </span>
              )}
            </span>
            <span className="price">€{station.e10.toFixed(3)}</span>
          </div>
        </div>
        
        {/* Price comparison */}
        <div className="price-comparison">
          <div className="comparison-item">
            <span className="comparison-label">Cheapest:</span>
            <span className="comparison-value">
              {Math.min(station.diesel, station.e5, station.e10) === station.diesel ? 'Diesel' :
               Math.min(station.diesel, station.e5, station.e10) === station.e5 ? 'E5' : 'E10'}
              (€{Math.min(station.diesel, station.e5, station.e10).toFixed(3)})
            </span>
          </div>
          <div className="comparison-item">
            <span className="comparison-label">Most Expensive:</span>
            <span className="comparison-value">
              {Math.max(station.diesel, station.e5, station.e10) === station.diesel ? 'Diesel' :
               Math.max(station.diesel, station.e5, station.e10) === station.e5 ? 'E5' : 'E10'}
              (€{Math.max(station.diesel, station.e5, station.e10).toFixed(3)})
            </span>
          </div>
        </div>
      </div>
      
      <div className="station-id">
        <small>Coordinates: {station.lat.toFixed(4)}, {station.lng.toFixed(4)}</small>
      </div>
    </div>
  );
};

// Zip code search component
const ZipCodeSearch: React.FC<{
  onLocationFound: (location: { lat: number; lng: number; name: string }) => void;
  currentLocation?: { lat: number; lng: number };
}> = ({ onLocationFound, currentLocation }) => {
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<
    Array<{ name: string; lat: number; lng: number; zipCode?: string }>
  >([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('gasStationsRecentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Save to recent searches
  const saveToRecentSearches = (location: { name: string; lat: number; lng: number; zipCode?: string }) => {
    const updatedSearches = [
      location,
      ...recentSearches.filter(s => 
        s.name !== location.name && s.zipCode !== location.zipCode
      ).slice(0, 4) // Keep only 5 most recent
    ];
    setRecentSearches(updatedSearches);
    localStorage.setItem('gasStationsRecentSearches', JSON.stringify(updatedSearches));
  };

  // Handle zip code search
  const handleZipCodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim() && !city.trim()) {
      setError('Please enter a zip code or city name');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);

    try {
      const query = zipCode.trim() || city.trim();
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=de&limit=5`
      );

      if (response.data.length === 0) {
        setError(`No location found for "${query}". Please try a different zip code or city name.`);
        return;
      }

      if (response.data.length === 1) {
        const location = response.data[0];
        const foundLocation = {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          name: location.display_name,
          zipCode: location.address?.postcode || zipCode
        };
        
        onLocationFound(foundLocation);
        saveToRecentSearches(foundLocation);
      } else {
        setSuggestions(response.data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Error searching location:', err);
      setError('Failed to search location. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const foundLocation = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      name: suggestion.display_name,
      zipCode: suggestion.address?.postcode || zipCode
    };
    
    onLocationFound(foundLocation);
    saveToRecentSearches(foundLocation);
    setShowSuggestions(false);
    setZipCode(suggestion.address?.postcode || '');
    setCity(suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '');
  };

  // Use current location
  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      onLocationFound({
        ...currentLocation,
        name: 'Current Location'
      });
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setZipCode('');
    setCity('');
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="zip-search-container">
      <form onSubmit={handleZipCodeSearch} className="zip-search-form">
        <div className="search-inputs">
          <div className="input-group">
            <label htmlFor="zipCode">
              <FaSearch className="icon" /> Zip Code
            </label>
            <input
              id="zipCode"
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="e.g., 10115"
              maxLength={10}
            />
          </div>
          
          <div className="input-divider">or</div>
          
          <div className="input-group">
            <label htmlFor="city">
              <FaMapMarkerAlt className="icon" /> City
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Berlin"
            />
          </div>
          
          <button 
            type="submit" 
            className="search-btn"
            disabled={isSearching || (!zipCode.trim() && !city.trim())}
          >
            {isSearching ? (
              <>
                <div className="spinner-small"></div>
                Searching...
              </>
            ) : (
              <>
                <FaSearch className="icon" />
                Search
              </>
            )}
          </button>
          
          {(zipCode || city) && (
            <button 
              type="button" 
              className="clear-btn"
              onClick={handleClearSearch}
            >
              <FaTimes className="icon" />
              Clear
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="search-error">
            <span>{error}</span>
          </div>
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            <div className="suggestions-header">
              <strong>Multiple locations found:</strong>
              <button 
                type="button" 
                className="close-suggestions"
                onClick={() => setShowSuggestions(false)}
              >
                <FaTimes />
              </button>
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <FaMapMarkerAlt className="icon" />
                <div className="suggestion-details">
                  <div className="suggestion-name">{suggestion.display_name}</div>
                  {suggestion.address?.postcode && (
                    <div className="suggestion-zip">Zip: {suggestion.address.postcode}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent searches */}
        {recentSearches.length > 0 && !showSuggestions && (
          <div className="recent-searches">
            <div className="recent-header">
              <strong>Recent Searches:</strong>
            </div>
            <div className="recent-items">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  type="button"
                  className="recent-item"
                  onClick={() => {
                    onLocationFound(search);
                    setZipCode(search.zipCode || '');
                  }}
                >
                  <FaMapMarkerAlt className="icon" />
                  <span className="recent-name">{search.name.split(',')[0]}</span>
                  {search.zipCode && (
                    <span className="recent-zip">({search.zipCode})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Current location button */}
      {currentLocation && (
        <div className="current-location-section">
          <button 
            type="button"
            className="current-location-btn"
            onClick={handleUseCurrentLocation}
          >
            <FaLocationArrow className="icon" />
            Use My Current Location
          </button>
        </div>
      )}
    </div>
  );
};

// Main component
const GasStationsList: React.FC<GasStationsListProps> = ({ data, initialUserLocation }) => {
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string } | undefined>(initialUserLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [activeLocation, setActiveLocation] = useState<'current' | 'searched'>('current');
  
  // Sorting and filtering states
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [priceType, setPriceType] = useState<FuelType>('all');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setActiveLocation('current');

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
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location services or use zip code search.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred while getting location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Handle zip code location found
  const handleZipCodeLocationFound = (location: { lat: number; lng: number; name: string; zipCode?: string }) => {
    setSearchedLocation(location);
    setUserLocation(location);
    setActiveLocation('searched');
    setLocationError(null);
  };

  // Initialize on client side and get location
  useEffect(() => {
    setIsClient(true);
    
    // Only get location if not provided as prop and no searched location
    if (!initialUserLocation && !searchedLocation) {
      getUserLocation();
    }
  }, [getUserLocation, initialUserLocation, searchedLocation]);

  // Type guard for data validation
  const isValidData = (data: GasStationData): boolean => {
    return data.ok && data.status === 'ok' && Array.isArray(data.stations);
  };

  if (!isValidData(data)) {
    return (
      <div className="error">
        <h2>Error Loading Data</h2>
        <p>Unable to retrieve gas station information.</p>
      </div>
    );
  }

  // Calculate distance from active location if available
  const stationsWithCalculatedDistance = data.stations.map(station => {
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

  // Filter stations
  let filteredStations = [...stationsWithCalculatedDistance];
  
  // Filter by open status
  if (showOnlyOpen) {
    filteredStations = filteredStations.filter(station => station.isOpen);
  }

  // Sort stations based on current sort settings
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
      case 'brand':
        valueA = a.brand.toLowerCase();
        valueB = b.brand.toLowerCase();
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

  const openStationsCount = filteredStations.filter(s => s.isOpen).length;

  const handleStationSelect = (station: GasStation) => {
    setSelectedStation(station);
  };

  const handleCenterOnUser = () => {
    if (activeLocation === 'current') {
      getUserLocation();
    }
  };

  // Calculate price statistics
  const calculatePriceStats = () => {
    if (sortedStations.length === 0) return null;
    
    const dieselPrices = sortedStations.map(s => s.diesel);
    const e5Prices = sortedStations.map(s => s.e5);
    const e10Prices = sortedStations.map(s => s.e10);
    
    const getStats = (prices: number[]) => ({
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
    });

    return {
      diesel: getStats(dieselPrices),
      e5: getStats(e5Prices),
      e10: getStats(e10Prices)
    };
  };

  const priceStats = calculatePriceStats();

  return (
    <div className="gas-stations-container">
      <header className="app-header">
        <h1>
          <FaGasPump className="header-icon" /> Gas Stations Finder
        </h1>
        <div className="license-info">
          License:{" "}
          <a 
            href="https://creativecommons.tankerkoenig.de" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {data.license}
          </a>
        </div>
        <div className="data-source">Data: {data.data}</div>
        
        {/* Zip Code Search */}
        <div className="search-section">
          <ZipCodeSearch 
            onLocationFound={handleZipCodeLocationFound}
            currentLocation={userLocation}
          />
        </div>
        
        {/* Location status */}
        <div className="location-status-display">
          {activeLocation === 'searched' && searchedLocation ? (
            <div className="location-active">
              <FaMapMarkerAlt className="icon" />
              <div>
                <strong>Search Location:</strong> {searchedLocation.name}
                <div className="coordinates-small">
                  {searchedLocation.lat.toFixed(4)}, {searchedLocation.lng.toFixed(4)}
                </div>
              </div>
              <button 
                onClick={getUserLocation}
                className="switch-location-btn"
              >
                <FaLocationArrow className="icon" />
                Switch to Current Location
              </button>
            </div>
          ) : (
            <div className="location-controls">
              <div className="location-status">
                {isLocating ? (
                  <div className="location-loading">
                    <div className="spinner-small"></div>
                    <span>Getting your location...</span>
                  </div>
                ) : userLocation ? (
                  <div className="location-success">
                    <FaLocationArrow className="icon" />
                    <div>
                      <strong>Using Current Location</strong>
                      <div className="coordinates-small">
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ) : locationError ? (
                  <div className="location-error">
                    <span>{locationError}</span>
                    <button onClick={getUserLocation} className="retry-btn">
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>
              
              <button 
                onClick={handleCenterOnUser}
                className="location-btn"
                disabled={isLocating || activeLocation !== 'current'}
              >
                <FaLocationArrow className="icon" />
                {isLocating ? 'Locating...' : 'Update My Location'}
              </button>
            </div>
          )}
        </div>

        {/* Stats and sorting info */}
        <div className="stats-container">
          <div className="stats">
            <div className="stat-item">
              <FaGasPump className="icon" />
              <span className="stat-value">{sortedStations.length}</span>
              <span className="stat-label">Total Stations</span>
            </div>
            <div className="stat-item">
              <FaGasPump className="icon open" />
              <span className="stat-value">{openStationsCount}</span>
              <span className="stat-label">Open Now</span>
            </div>
            {priceStats && sortBy.startsWith('price_') && (
              <div className="stat-item">
                <FaMoneyBillWave className="icon" />
                <span className="stat-value">€{priceStats[sortBy.split('_')[1] as keyof typeof priceStats]?.min.toFixed(3)}</span>
                <span className="stat-label">Best Price</span>
              </div>
            )}
            <div className="stat-item">
              <FaSort className="icon" />
              <span className="stat-value">
                {sortBy === 'distance' ? 'Distance' :
                 sortBy === 'price_diesel' ? 'Diesel Price' :
                 sortBy === 'price_e5' ? 'E5 Price' :
                 sortBy === 'price_e10' ? 'E10 Price' :
                 sortBy === 'name' ? 'Name' : 'Brand'}
              </span>
              <span className="stat-label">Sorted By</span>
            </div>
          </div>
        </div>
        
        {/* View mode toggle */}
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            🗺️ Map View
          </button>
        </div>
      </header>

      {/* Sorting and Filtering Controls */}
      <SortFilterControls
        sortBy={sortBy}
        sortDirection={sortDirection}
        priceType={priceType}
        showOnlyOpen={showOnlyOpen}
        onSortChange={setSortBy}
        onSortDirectionChange={setSortDirection}
        onPriceTypeChange={setPriceType}
        onShowOnlyOpenChange={setShowOnlyOpen}
      />

      {/* Map View - Only render on client side */}
      {viewMode === 'map' && isClient && (
        <div className="map-section">
          <div className="map-header">
            <h2>
              <FaMapMarkerAlt className="icon" /> Stations Map
            </h2>
            {userLocation && (
              <div className="map-actions">
                <button 
                  className="action-btn"
                  onClick={() => {
                    const nearestStation = sortedStations[0];
                    if (nearestStation) {
                      handleStationSelect(nearestStation);
                    }
                  }}
                >
                  <FaGasPump className="icon" /> Find Nearest Station
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => {
                    // Find station with best price for current sort
                    if (sortBy.startsWith('price_')) {
                      const fuelType = sortBy.split('_')[1];
                      const sortedByPrice = [...sortedStations].sort((a, b) => 
                        sortDirection === 'asc' 
                          ? a[fuelType as keyof GasStation] as number - (b[fuelType as keyof GasStation] as number)
                          : b[fuelType as keyof GasStation] as number - (a[fuelType as keyof GasStation] as number)
                      );
                      if (sortedByPrice[0]) {
                        handleStationSelect(sortedByPrice[0]);
                      }
                    }
                  }}
                  disabled={!sortBy.startsWith('price_')}
                >
                  <FaMoneyBillWave className="icon" /> Find Best Price
                </button>
              </div>
            )}
          </div>
          
          <MapView 
            stations={sortedStations}
            selectedStation={selectedStation}
            userLocation={userLocation}
            onStationSelect={handleStationSelect}
            onCenterUserLocation={handleCenterOnUser}
            searchedLocation={searchedLocation}
          />
          
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-icon open"></div>
              <span>Open Station</span>
            </div>
            <div className="legend-item">
              <div className="legend-icon closed"></div>
              <span>Closed Station</span>
            </div>
            <div className="legend-item">
              <div className="legend-icon selected"></div>
              <span>Selected Station</span>
            </div>
            {userLocation && activeLocation === 'current' && (
              <div className="legend-item">
                <div className="legend-icon user"></div>
                <span>Your Location</span>
              </div>
            )}
            {searchedLocation && (
              <div className="legend-item">
                <div className="legend-icon searched"></div>
                <span>Search Location</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="stations-list-section">
          <div className="list-header">
            <h2>
              <FaGasPump className="icon" /> Stations List
              <span className="sort-info">
                Sorted by: <strong>
                  {sortBy === 'distance' ? 'Distance' :
                   sortBy === 'price_diesel' ? 'Diesel Price' :
                   sortBy === 'price_e5' ? 'E5 Price' :
                   sortBy === 'price_e10' ? 'E10 Price' :
                   sortBy === 'name' ? 'Station Name' : 'Brand'}
                </strong>
                ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
                {showOnlyOpen && <span className="filter-tag">Open Only</span>}
                {priceType !== 'all' && <span className="filter-tag">{priceType.toUpperCase()}</span>}
              </span>
            </h2>
            {userLocation && sortedStations.length > 0 && (
              <div className="nearest-station-info">
                {sortBy === 'distance' ? (
                  <>
                    <strong>Nearest station:</strong> {sortedStations[0].name} ({sortedStations[0].dist.toFixed(1)} km away)
                  </>
                ) : sortBy.startsWith('price_') && priceStats ? (
                  <>
                    <strong>Best price ({sortBy.split('_')[1]}):</strong> €{sortedStations[0][sortBy.split('_')[1] as keyof GasStation]?.toFixed(3)} at {sortedStations[0].name}
                  </>
                ) : null}
              </div>
            )}
          </div>
          <div className="stations-list">
            {sortedStations.map((station) => (
              <GasStationCard 
                key={station.id} 
                station={station}
                onSelectStation={handleStationSelect}
                isSelected={selectedStation?.id === station.id}
                sortBy={sortBy}
                priceType={priceType}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Selected Station Details */}
      {selectedStation && (
        <div className="selected-station-details">
          <h3>
            <FaMapMarkerAlt className="icon" /> Selected Station Details
          </h3>
          <div className="details-grid">
            <div className="detail-item">
              <strong>Name:</strong> {selectedStation.name}
            </div>
            <div className="detail-item">
              <strong>Address:</strong> {selectedStation.street} {selectedStation.houseNumber}, {selectedStation.postCode} {selectedStation.place}
            </div>
            <div className="detail-item">
              <strong>Coordinates:</strong> {selectedStation.lat.toFixed(6)}, {selectedStation.lng.toFixed(6)}
            </div>
            <div className="detail-item">
              <strong>Distance:</strong> {selectedStation.dist.toFixed(1)} km
              {userLocation && (
                <span className="distance-source">
                  {activeLocation === 'current' ? ' from you' : ' from search location'}
                </span>
              )}
            </div>
            <div className="detail-item">
              <strong>Cheapest Fuel:</strong> {
                Math.min(selectedStation.diesel, selectedStation.e5, selectedStation.e10) === selectedStation.diesel ? 'Diesel' :
                Math.min(selectedStation.diesel, selectedStation.e5, selectedStation.e10) === selectedStation.e5 ? 'E5' : 'E10'
              } at €{Math.min(selectedStation.diesel, selectedStation.e5, selectedStation.e10).toFixed(3)}
            </div>
            {userLocation && (
              <div className="detail-item">
                <strong>Directions:</strong> 
                <a 
                  href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${selectedStation.lat},${selectedStation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="directions-link"
                >
                  Get Directions (Google Maps)
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      
      <footer className="app-footer">
        <p>Data provided by Tankerkönig API • Map data © OpenStreetMap contributors • Location search powered by Nominatim</p>
      </footer>
    </div>
  );
};

// Export types for use elsewhere
export type { GasStation, GasStationData, GasStationCardProps, GasStationsListProps };
export default GasStationsList;