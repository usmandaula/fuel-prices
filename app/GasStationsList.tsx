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
  FaMap,
  FaCompass,
  FaLayerGroup,
  FaRuler,
  FaCar,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaChevronRight,
  FaInfoCircle,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import axios from 'axios';

// Dynamically import the enhanced map component
const DetailedMapView = dynamic(() => import('./DetailedMapView'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="map-spinner"></div>
      <p>Loading detailed map...</p>
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
  rating?: number;
  amenities?: string[];
}

interface GasStationData {
  ok: boolean;
  license: string;
  data: string;
  status: string;
  stations: GasStation[];
}

interface GasStationsListProps {
  data: GasStationData;
  initialUserLocation?: { lat: number; lng: number };
}

// Sorting types
type SortOption = 'distance' | 'price_diesel' | 'price_e5' | 'price_e10' | 'name' | 'rating';
type SortDirection = 'asc' | 'desc';
type MapLayer = 'standard' | 'satellite' | 'terrain';

// Calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Enhanced search component
const EnhancedSearch: React.FC<{
  onLocationFound: (location: { lat: number; lng: number; name: string }) => void;
  currentLocation?: { lat: number; lng: number };
}> = ({ onLocationFound, currentLocation }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('gasRecentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  const searchLocation = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=de&limit=5`
      );
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const results = await searchLocation(query);
    if (results.length > 0) {
      const firstResult = results[0];
      const location = {
        lat: parseFloat(firstResult.lat),
        lng: parseFloat(firstResult.lon),
        name: firstResult.display_name
      };
      onLocationFound(location);
      
      // Save to recent searches
      const updatedRecent = [
        { ...location, query },
        ...recentSearches.filter(s => s.query !== query)
      ].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('gasRecentSearches', JSON.stringify(updatedRecent));
    }
  };

  const handleInputChange = async (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      const results = await searchLocation(value);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="enhanced-search">
      <form onSubmit={handleSearch} className="search-bar">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search location, address, or zip code..."
            className="search-input"
          />
          {query && (
            <button 
              type="button" 
              className="clear-search"
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
              }}
            >
              <FaTimes />
            </button>
          )}
          <button 
            type="submit" 
            className="search-submit"
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>
        
        <button 
          type="button"
          className="current-location-btn"
          onClick={() => currentLocation && onLocationFound({...currentLocation, name: 'Current Location'})}
          title="Use current location"
        >
          <FaLocationArrow />
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((item, index) => (
            <div 
              key={index}
              className="suggestion-item"
              onClick={() => {
                const location = {
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon),
                  name: item.display_name
                };
                onLocationFound(location);
                setQuery(item.display_name);
                setShowSuggestions(false);
              }}
            >
              <FaMapMarkerAlt className="suggestion-icon" />
              <div className="suggestion-content">
                <div className="suggestion-title">{item.display_name.split(',')[0]}</div>
                <div className="suggestion-subtitle">{item.display_name.split(',').slice(1).join(',').trim()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentSearches.length > 0 && !showSuggestions && query.length === 0 && (
        <div className="recent-searches">
          <div className="recent-header">Recent Searches</div>
          <div className="recent-items">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                className="recent-item"
                onClick={() => {
                  onLocationFound(search);
                  setQuery(search.query);
                }}
              >
                <FaSearch className="recent-icon" />
                <span>{search.query}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced station card for sidebar
const StationCard: React.FC<{
  station: GasStation;
  isSelected: boolean;
  onSelect: (station: GasStation) => void;
  sortBy: SortOption;
}> = ({ station, isSelected, onSelect, sortBy }) => {
  const cheapestFuel = Math.min(station.diesel, station.e5, station.e10);
  const isCheapestDiesel = cheapestFuel === station.diesel;
  const isCheapestE5 = cheapestFuel === station.e5;
  const isCheapestE10 = cheapestFuel === station.e10;

  return (
    <div 
      className={`station-card ${isSelected ? 'selected' : ''} ${station.isOpen ? 'open' : 'closed'}`}
      onClick={() => onSelect(station)}
    >
      <div className="card-header">
        <div className="station-info">
          <h3 className="station-name">
            <FaGasPump className="station-icon" />
            {station.name}
          </h3>
          <div className="station-meta">
            <span className={`status-badge ${station.isOpen ? 'open' : 'closed'}`}>
              {station.isOpen ? 'Open Now' : 'Closed'}
            </span>
            <span className="brand-badge">{station.brand}</span>
            {station.rating && (
              <div className="rating">
                {[...Array(5)].map((_, i) => (
                  i < Math.floor(station.rating!) ? 
                    <FaStar key={i} className="star filled" /> : 
                    <FaRegStar key={i} className="star" />
                ))}
                <span className="rating-value">{station.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="distance-indicator">
          <FaRuler className="distance-icon" />
          <span className="distance-value">{station.dist.toFixed(1)} km</span>
          {sortBy === 'distance' && <div className="sort-indicator"></div>}
        </div>
      </div>

      <div className="card-content">
        <div className="location-info">
          <FaMapMarkerAlt className="location-icon" />
          <span>{station.street} {station.houseNumber}, {station.place}</span>
        </div>

        <div className="prices-grid">
          <div className={`price-item ${isCheapestDiesel ? 'cheapest' : ''} ${sortBy === 'price_diesel' ? 'sorting' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">Diesel</span>
              {isCheapestDiesel && <span className="cheapest-tag">Best</span>}
            </div>
            <div className="price-value">€{station.diesel.toFixed(3)}</div>
          </div>
          <div className={`price-item ${isCheapestE5 ? 'cheapest' : ''} ${sortBy === 'price_e5' ? 'sorting' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">E5</span>
              {isCheapestE5 && <span className="cheapest-tag">Best</span>}
            </div>
            <div className="price-value">€{station.e5.toFixed(3)}</div>
          </div>
          <div className={`price-item ${isCheapestE10 ? 'cheapest' : ''} ${sortBy === 'price_e10' ? 'sorting' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">E10</span>
              {isCheapestE10 && <span className="cheapest-tag">Best</span>}
            </div>
            <div className="price-value">€{station.e10.toFixed(3)}</div>
          </div>
        </div>

        {station.amenities && station.amenities.length > 0 && (
          <div className="amenities">
            <div className="amenities-label">Facilities:</div>
            <div className="amenities-list">
              {station.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="amenity-tag">{amenity}</span>
              ))}
              {station.amenities.length > 3 && (
                <span className="amenity-more">+{station.amenities.length - 3}</span>
              )}
            </div>
          </div>
        )}

        <div className="card-actions">
          <button className="action-btn directions">
            <FaRoute />
            Directions
          </button>
          <button className="action-btn details">
            <FaChevronRight />
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Map controls component
const MapControls: React.FC<{
  onLayerChange: (layer: MapLayer) => void;
  onToggleTraffic: () => void;
  onToggleSatellite: () => void;
  onRecenter: () => void;
  activeLayer: MapLayer;
  showTraffic: boolean;
  showSatellite: boolean;
}> = ({ onLayerChange, onToggleTraffic, onToggleSatellite, onRecenter, activeLayer, showTraffic, showSatellite }) => {
  return (
    <div className="map-controls">
      <div className="controls-group">
        <button 
          className={`control-btn ${activeLayer === 'standard' ? 'active' : ''}`}
          onClick={() => onLayerChange('standard')}
          title="Standard Map"
        >
          <FaLayerGroup />
        </button>
        <button 
          className={`control-btn ${activeLayer === 'satellite' ? 'active' : ''}`}
          onClick={() => onLayerChange('satellite')}
          title="Satellite View"
        >
          <FaEye />
        </button>
        <button 
          className={`control-btn ${activeLayer === 'terrain' ? 'active' : ''}`}
          onClick={() => onLayerChange('terrain')}
          title="Terrain View"
        >
          <FaCompass />
        </button>
      </div>
      
      <div className="controls-group">
        <button 
          className={`control-btn ${showTraffic ? 'active' : ''}`}
          onClick={onToggleTraffic}
          title="Show Traffic"
        >
          <FaCar />
        </button>
        <button 
          className="control-btn"
          onClick={onRecenter}
          title="Recenter Map"
        >
          <FaLocationArrow />
        </button>
      </div>
    </div>
  );
};

// Main component
const GasStationsList: React.FC<GasStationsListProps> = ({ data, initialUserLocation }) => {
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string } | undefined>(initialUserLocation);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Sorting states
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'diesel' | 'e5' | 'e10'>('all');
  
  // Map controls
  const [mapLayer, setMapLayer] = useState<MapLayer>('standard');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);

  // Get user location
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
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Handle location found
  const handleLocationFound = (location: { lat: number; lng: number; name: string }) => {
    setSearchedLocation(location);
    setUserLocation(location);
  };

  // Initialize
  useEffect(() => {
    if (!initialUserLocation && !searchedLocation) {
      getUserLocation();
    }
  }, [getUserLocation, initialUserLocation, searchedLocation]);

  // Validate data
  if (!data.ok || data.status !== 'ok' || !Array.isArray(data.stations)) {
    return (
      <div className="error-container">
        <div className="error-content">
          <FaInfoCircle className="error-icon" />
          <h2>Unable to Load Data</h2>
          <p>Please check your connection and try again.</p>
          <button className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  // Process stations
  const stationsWithDistances = data.stations.map(station => {
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        station.lat,
        station.lng
      );
      return { 
        ...station, 
        dist: distance,
        rating: Math.random() * 2 + 3, // Mock rating
        amenities: ['24/7', 'Car Wash', 'Shop', 'ATM'].slice(0, Math.floor(Math.random() * 4) + 1)
      };
    }
    return station;
  });

  // Filter and sort
  let filteredStations = [...stationsWithDistances];
  
  if (showOnlyOpen) {
    filteredStations = filteredStations.filter(station => station.isOpen);
  }

  if (priceFilter !== 'all') {
    filteredStations = filteredStations.sort((a, b) => 
      (a[priceFilter] as number) - (b[priceFilter] as number)
    );
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
      case 'rating':
        valueA = a.rating || 0;
        valueB = b.rating || 0;
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

  // Statistics
  const openStationsCount = sortedStations.filter(s => s.isOpen).length;
  const cheapestStation = sortedStations[0];
  const averagePrice = sortedStations.length > 0 
    ? (sortedStations.reduce((sum, s) => sum + s.diesel + s.e5 + s.e10, 0) / (sortedStations.length * 3)).toFixed(3)
    : '0.000';

  return (
    <div className="gas-stations-app-enhanced">
      {/* Top Navigation */}
      <nav className="app-nav">
        <div className="nav-left">
          <div className="app-brand">
            <FaGasPump className="brand-icon" />
            <h1>FuelFinder</h1>
            <span className="beta-badge">BETA</span>
          </div>
        </div>
        
        <div className="nav-center">
          <EnhancedSearch 
            onLocationFound={handleLocationFound}
            currentLocation={userLocation}
          />
        </div>
        
        <div className="nav-right">
          <div className="view-switch">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList />
              <span>List</span>
            </button>
            <button 
              className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <FaMap />
              <span>Map</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        {/* Left Sidebar */}
        <aside className="app-sidebar">
          <div className="sidebar-header">
            <h2>Gas Stations</h2>
            <div className="station-count">
              <span className="count-number">{sortedStations.length}</span>
              <span className="count-label">stations</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="quick-filters">
            <div className="filter-group">
              <label className="filter-label">Sort by:</label>
              <div className="sort-options">
                {['distance', 'price_diesel', 'price_e5', 'price_e10', 'name', 'rating'].map((option) => (
                  <button
                    key={option}
                    className={`sort-option ${sortBy === option ? 'active' : ''}`}
                    onClick={() => setSortBy(option as SortOption)}
                  >
                    {option === 'distance' && <FaRuler />}
                    {option.startsWith('price_') && <FaMoneyBillWave />}
                    {option === 'name' && <FaGasPump />}
                    {option === 'rating' && <FaStar />}
                    <span>{option.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Filters:</label>
              <div className="filter-options">
                <button 
                  className={`filter-toggle ${showOnlyOpen ? 'active' : ''}`}
                  onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                >
                  <FaFilter />
                  <span>Open Now ({openStationsCount})</span>
                </button>
                
                <div className="price-filter">
                  <span className="filter-label">Fuel Type:</span>
                  <div className="price-buttons">
                    {['all', 'diesel', 'e5', 'e10'].map((type) => (
                      <button
                        key={type}
                        className={`price-btn ${priceFilter === type ? 'active' : ''}`}
                        onClick={() => setPriceFilter(type as any)}
                      >
                        {type === 'all' ? 'All' : type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sort-direction">
              <button 
                className={`direction-btn ${sortDirection === 'asc' ? 'active' : ''}`}
                onClick={() => setSortDirection('asc')}
              >
                <FaSortAmountDown />
                <span>Ascending</span>
              </button>
              <button 
                className={`direction-btn ${sortDirection === 'desc' ? 'active' : ''}`}
                onClick={() => setSortDirection('desc')}
              >
                <FaSortAmountUp />
                <span>Descending</span>
              </button>
            </div>
          </div>

          {/* Station List */}
          <div className="stations-list">
            {sortedStations.length === 0 ? (
              <div className="empty-state">
                <FaGasPump className="empty-icon" />
                <p>No stations found</p>
                <p className="empty-subtitle">Try adjusting your filters</p>
              </div>
            ) : (
              sortedStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  isSelected={selectedStation?.id === station.id}
                  onSelect={setSelectedStation}
                  sortBy={sortBy}
                />
              ))
            )}
          </div>

          {/* Stats Footer */}
          <div className="sidebar-footer">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{openStationsCount}</div>
                <div className="stat-label">Open Now</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">€{averagePrice}</div>
                <div className="stat-label">Avg Price</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {cheapestStation ? `€${Math.min(
                    cheapestStation.diesel,
                    cheapestStation.e5,
                    cheapestStation.e10
                  ).toFixed(3)}` : '-'}
                </div>
                <div className="stat-label">Best Price</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Map Area */}
        <div className="app-map-area">
          {viewMode === 'map' ? (
            <>
              <div className="map-container">
                <DetailedMapView
                  stations={sortedStations}
                  selectedStation={selectedStation}
                  userLocation={userLocation}
                  onStationSelect={setSelectedStation}
                  searchedLocation={searchedLocation}
                  mapLayer={mapLayer}
                  showTraffic={showTraffic}
                  onZoomChange={setMapZoom}
                />
                
                {/* Map Controls Overlay */}
                <MapControls
                  onLayerChange={setMapLayer}
                  onToggleTraffic={() => setShowTraffic(!showTraffic)}
                  onToggleSatellite={() => setShowSatellite(!showSatellite)}
                  onRecenter={getUserLocation}
                  activeLayer={mapLayer}
                  showTraffic={showTraffic}
                  showSatellite={showSatellite}
                />

                {/* Zoom Indicator */}
                <div className="zoom-indicator">
                  <div className="zoom-level">Zoom: {mapZoom}x</div>
                </div>

                {/* Selected Station Info Overlay */}
                {selectedStation && (
                  <div className="selected-overlay">
                    <div className="overlay-header">
                      <h3>{selectedStation.name}</h3>
                      <button 
                        className="close-overlay"
                        onClick={() => setSelectedStation(null)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="overlay-content">
                      <div className="overlay-prices">
                        <div className="price-display">
                          <span className="fuel-type">Diesel</span>
                          <span className="fuel-price">€{selectedStation.diesel.toFixed(3)}</span>
                        </div>
                        <div className="price-display">
                          <span className="fuel-type">E5</span>
                          <span className="fuel-price">€{selectedStation.e5.toFixed(3)}</span>
                        </div>
                        <div className="price-display">
                          <span className="fuel-type">E10</span>
                          <span className="fuel-price">€{selectedStation.e10.toFixed(3)}</span>
                        </div>
                      </div>
                      <button className="get-directions-btn">
                        <FaRoute />
                        Get Directions ({selectedStation.dist.toFixed(1)} km)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Legend */}
              <div className="map-legend">
                <div className="legend-title">Map Legend</div>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-color open"></div>
                    <span>Open Station</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color closed"></div>
                    <span>Closed Station</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color selected"></div>
                    <span>Selected</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color user"></div>
                    <span>Your Location</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color searched"></div>
                    <span>Search Location</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="list-view-container">
              {/* Alternative list view for large screens */}
              <div className="list-view-header">
                <h2>Gas Stations List View</h2>
                <div className="list-stats">
                  <span>{sortedStations.length} stations • </span>
                  <span>{openStationsCount} open • </span>
                  <span>Sorted by {sortBy.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Info Bar */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="location-info">
              <FaMapMarkerAlt />
              {userLocation?.name || 'Locating...'}
            </span>
            {isLocating && (
              <span className="locating-indicator">
                <div className="pulse-dot"></div>
                Locating...
              </span>
            )}
          </div>
          <div className="footer-center">
            <span className="data-source">Data: {data.data} • Map: OpenStreetMap</span>
          </div>
          <div className="footer-right">
            <button 
              className="refresh-btn"
              onClick={getUserLocation}
              disabled={isLocating}
            >
              <FaLocationArrow />
              {isLocating ? 'Updating...' : 'Refresh Location'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GasStationsList;