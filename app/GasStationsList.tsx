"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  FaTimes,
  FaChevronRight,
  FaInfoCircle,
  FaStar,
  FaRegStar,
  FaShoppingCart,
  FaCoffee,
  FaBuilding,
  FaHome,
  FaPhone,
  FaClock,
  FaChevronLeft,
  FaChevronDown,
  FaArrowLeft,
  FaCrown,
  FaTrophy
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
  isBestForSelectedFuel?: boolean;
  isOverallBestPrice?: boolean;
  minPrice?: number;
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
type SortOption = 'distance' | 'price_diesel' | 'price_e5' | 'price_e10' | 'name' | 'rating' | 'best_price';
type SortDirection = 'low_to_high' | 'high_to_low';
type MapLayer = 'standard' | 'satellite' | 'terrain';
type FuelType = 'diesel' | 'e5' | 'e10';

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

// Enhanced station card for list view
const StationCard: React.FC<{
  station: GasStation;
  isSelected: boolean;
  onSelect: (station: GasStation) => void;
  sortBy: SortOption;
  isBestForSelectedFuel?: boolean;
  isOverallBestPrice?: boolean;
  selectedFuelType?: 'all' | 'diesel' | 'e5' | 'e10';
}> = ({ station, isSelected, onSelect, sortBy, isBestForSelectedFuel = false, isOverallBestPrice = false, selectedFuelType = 'all' }) => {
  // Find the cheapest fuel type for this station
  const getCheapestFuel = () => {
    const fuels = [
      { type: 'diesel' as const, price: station.diesel },
      { type: 'e5' as const, price: station.e5 },
      { type: 'e10' as const, price: station.e10 }
    ];
    return fuels.reduce((cheapest, fuel) => 
      fuel.price < cheapest.price ? fuel : cheapest
    );
  };

  const cheapestFuel = getCheapestFuel();
  const isCheapestDiesel = cheapestFuel.type === 'diesel';
  const isCheapestE5 = cheapestFuel.type === 'e5';
  const isCheapestE10 = cheapestFuel.type === 'e10';

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'car wash': return <FaCar key={amenity} className="amenity-icon" title="Car Wash" />;
      case 'shop': return <FaShoppingCart key={amenity} className="amenity-icon" title="Shop" />;
      case '24/7': return <FaGasPump key={amenity} className="amenity-icon" title="24/7" />;
      case 'cafe': return <FaCoffee key={amenity} className="amenity-icon" title="Cafe" />;
      case 'atm': return <FaBuilding key={amenity} className="amenity-icon" title="ATM" />;
      default: return <FaHome key={amenity} className="amenity-icon" title={amenity} />;
    }
  };

  return (
    <div 
      className={`station-card ${isSelected ? 'selected' : ''} ${station.isOpen ? 'open' : 'closed'} ${isBestForSelectedFuel ? 'best-price-for-fuel' : ''} ${isOverallBestPrice ? 'overall-best-price' : ''}`}
      onClick={() => onSelect(station)}
    >
      {isOverallBestPrice && selectedFuelType === 'all' && (
        <div className="overall-best-badge">
          <FaCrown />
          <span>Best Overall Price</span>
        </div>
      )}

      {isBestForSelectedFuel && selectedFuelType !== 'all' && (
        <div className="best-fuel-badge">
          <FaTrophy />
          <span>Best {selectedFuelType.toUpperCase()} Price</span>
        </div>
      )}

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
          <div className={`price-item ${isCheapestDiesel ? 'cheapest' : ''} ${sortBy === 'price_diesel' ? 'sorting' : ''} ${selectedFuelType === 'diesel' && station.isBestForSelectedFuel ? 'best-selected-fuel' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">Diesel</span>
              {isCheapestDiesel && (
                <span className="cheapest-tag">
                  <FaTrophy />
                  Best
                </span>
              )}
            </div>
            <div className="price-value">€{station.diesel.toFixed(3)}</div>
            {selectedFuelType === 'diesel' && station.isBestForSelectedFuel && (
              <div className="best-price-indicator">Best Price</div>
            )}
          </div>
          <div className={`price-item ${isCheapestE5 ? 'cheapest' : ''} ${sortBy === 'price_e5' ? 'sorting' : ''} ${selectedFuelType === 'e5' && station.isBestForSelectedFuel ? 'best-selected-fuel' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">E5</span>
              {isCheapestE5 && (
                <span className="cheapest-tag">
                  <FaTrophy />
                  Best
                </span>
              )}
            </div>
            <div className="price-value">€{station.e5.toFixed(3)}</div>
            {selectedFuelType === 'e5' && station.isBestForSelectedFuel && (
              <div className="best-price-indicator">Best Price</div>
            )}
          </div>
          <div className={`price-item ${isCheapestE10 ? 'cheapest' : ''} ${sortBy === 'price_e10' ? 'sorting' : ''} ${selectedFuelType === 'e10' && station.isBestForSelectedFuel ? 'best-selected-fuel' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">E10</span>
              {isCheapestE10 && (
                <span className="cheapest-tag">
                  <FaTrophy />
                  Best
                </span>
              )}
            </div>
            <div className="price-value">€{station.e10.toFixed(3)}</div>
            {selectedFuelType === 'e10' && station.isBestForSelectedFuel && (
              <div className="best-price-indicator">Best Price</div>
            )}
          </div>
        </div>

        {/* Overall Best Price Highlight */}
        {selectedFuelType === 'all' && station.isOverallBestPrice && station.minPrice && (
          <div className="overall-best-price-highlight">
            <div className="overall-best-badge-inline">
              <FaCrown />
              <span>Best Overall Price: €{station.minPrice.toFixed(3)}</span>
            </div>
          </div>
        )}

        {/* Selected Fuel Best Price Highlight */}
        {selectedFuelType !== 'all' && station.isBestForSelectedFuel && (
          <div className="selected-fuel-best-price">
            <div className="selected-fuel-best-badge">
              <FaTrophy />
              <span>Best {selectedFuelType.toUpperCase()} Price: €{
                selectedFuelType === 'diesel' ? station.diesel.toFixed(3) :
                selectedFuelType === 'e5' ? station.e5.toFixed(3) :
                station.e10.toFixed(3)
              }</span>
            </div>
          </div>
        )}

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
            <div className="amenities-icons">
              {station.amenities.slice(0, 4).map((amenity, index) => getAmenityIcon(amenity))}
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
  onRecenter: () => void;
  activeLayer: MapLayer;
  showTraffic: boolean;
}> = ({ onLayerChange, onToggleTraffic, onRecenter, activeLayer, showTraffic }) => {
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

// Sidebar for list view (shows only filters, no station cards)
const ListViewSidebar: React.FC<{
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  setPriceFilter: (filter: 'all' | 'diesel' | 'e5' | 'e10') => void;
  openStationsCount: number;
  sortedStationsLength: number;
  averagePrice: string;
  bestPriceInfo: { price: number; stationName?: string; type?: 'overall' | 'diesel' | 'e5' | 'e10' } | null;
  selectedFuelType: 'all' | 'diesel' | 'e5' | 'e10';
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}> = ({
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  showOnlyOpen,
  setShowOnlyOpen,
  priceFilter,
  setPriceFilter,
  openStationsCount,
  sortedStationsLength,
  averagePrice,
  bestPriceInfo,
  selectedFuelType,
  onToggleSidebar,
  isSidebarCollapsed = false
}) => {
  return (
    <aside className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          {onToggleSidebar && (
            <button className="sidebar-toggle-btn" onClick={onToggleSidebar}>
              {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          )}
          <h2>Filters & Sorting</h2>
        </div>
        <div className="station-count">
          <span className="count-number">{sortedStationsLength}</span>
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
            className={`direction-btn ${sortDirection === 'low_to_high' ? 'active' : ''}`}
            onClick={() => setSortDirection('low_to_high')}
          >
            <FaSortAmountDown />
            <span>Low to High</span>
          </button>
          <button 
            className={`direction-btn ${sortDirection === 'high_to_low' ? 'active' : ''}`}
            onClick={() => setSortDirection('high_to_low')}
          >
            <FaSortAmountUp />
            <span>High to Low</span>
          </button>
        </div>
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
              {bestPriceInfo ? 
                `€${bestPriceInfo.price.toFixed(3)}` : 
                '-'
              }
            </div>
            <div className="stat-label">
              {selectedFuelType === 'all' ? 'Best Overall' : `Best ${selectedFuelType.toUpperCase()}`}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Main component
const GasStationsList: React.FC<GasStationsListProps> = ({ data, initialUserLocation }) => {
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string } | undefined>(initialUserLocation);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Sorting states
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('low_to_high');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'diesel' | 'e5' | 'e10'>('all');
  
  // Map controls
  const [mapLayer, setMapLayer] = useState<MapLayer>('standard');
  const [showTraffic, setShowTraffic] = useState(false);
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

  // Get directions
  const getDirections = (station: GasStation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, '_blank');
  };

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
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

  // Process stations with distances and calculate min price
  const stationsWithDistances = useMemo(() => {
    return data.stations.map(station => {
      if (userLocation) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          station.lat,
          station.lng
        );
        const minPrice = Math.min(station.diesel, station.e5, station.e10);
        return { 
          ...station, 
          dist: distance,
          minPrice,
          rating: Math.random() * 2 + 3, // Mock rating
          amenities: ['24/7', 'Car Wash', 'Shop', 'ATM'].slice(0, Math.floor(Math.random() * 4) + 1)
        };
      }
      const minPrice = Math.min(station.diesel, station.e5, station.e10);
      return { ...station, minPrice };
    });
  }, [data.stations, userLocation]);

  // Find best price information
  const { bestPriceInfo, processedStations } = useMemo(() => {
    let bestPrice = Infinity;
    let bestStation = null;
    let bestFuelType: 'diesel' | 'e5' | 'e10' = 'diesel';
    
    // Calculate best overall price
    stationsWithDistances.forEach(station => {
      if (station.minPrice < bestPrice) {
        bestPrice = station.minPrice;
        bestStation = station;
      }
    });

    // Mark stations with best prices
    const stationsWithBestMarks = stationsWithDistances.map(station => {
      const isOverallBestPrice = station.id === bestStation?.id;
      
      // For specific fuel types
      let isBestForSelectedFuel = false;
      if (priceFilter !== 'all') {
        // Find best price for selected fuel type
        let bestFuelPrice = Infinity;
        stationsWithDistances.forEach(s => {
          const price = s[priceFilter];
          if (price < bestFuelPrice) {
            bestFuelPrice = price;
          }
        });
        isBestForSelectedFuel = station[priceFilter] === bestFuelPrice;
      }

      return {
        ...station,
        isOverallBestPrice,
        isBestForSelectedFuel
      };
    });

    const bestPriceData = bestStation ? { 
      price: bestPrice, 
      stationName: bestStation.name,
      type: 'overall' as const
    } : null;

    return { 
      bestPriceInfo: bestPriceData, 
      processedStations: stationsWithBestMarks 
    };
  }, [stationsWithDistances, priceFilter]);

  // Filter and sort stations
  const { filteredStations, sortedStations } = useMemo(() => {
    // First filter
    let filtered = [...processedStations];
    
    if (showOnlyOpen) {
      filtered = filtered.filter(station => station.isOpen);
    }

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
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
        return sortDirection === 'low_to_high' ? valueA - valueB : valueB - valueA;
      } else {
        return sortDirection === 'low_to_high' 
          ? valueA.localeCompare(valueB as string)
          : (valueB as string).localeCompare(valueA);
      }
    });

    return { filteredStations: filtered, sortedStations: sorted };
  }, [processedStations, showOnlyOpen, sortBy, sortDirection]);

  // Statistics
  const openStationsCount = useMemo(() => 
    sortedStations.filter(s => s.isOpen).length,
    [sortedStations]
  );

  const averagePrice = useMemo(() => 
    sortedStations.length > 0 
      ? (sortedStations.reduce((sum, s) => sum + s.diesel + s.e5 + s.e10, 0) / (sortedStations.length * 3)).toFixed(3)
      : '0.000',
    [sortedStations]
  );

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
        {viewMode === 'map' ? (
          // Map View Layout
          <>
            {/* Map View Sidebar (with station cards) */}
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
                    className={`direction-btn ${sortDirection === 'low_to_high' ? 'active' : ''}`}
                    onClick={() => setSortDirection('low_to_high')}
                  >
                    <FaSortAmountDown />
                    <span>Low to High</span>
                  </button>
                  <button 
                    className={`direction-btn ${sortDirection === 'high_to_low' ? 'active' : ''}`}
                    onClick={() => setSortDirection('high_to_low')}
                  >
                    <FaSortAmountUp />
                    <span>High to Low</span>
                  </button>
                </div>
              </div>

              {/* Station List (Only in Map View) */}
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
                      isBestForSelectedFuel={station.isBestForSelectedFuel || false}
                      isOverallBestPrice={station.isOverallBestPrice || false}
                      selectedFuelType={priceFilter}
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
                      {bestPriceInfo ? 
                        `€${bestPriceInfo.price.toFixed(3)}` : 
                        '-'
                      }
                    </div>
                    <div className="stat-label">
                      {priceFilter === 'all' ? 'Best Overall' : `Best ${priceFilter.toUpperCase()}`}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Map Area */}
            <div className="app-map-area">
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
                  onRecenter={getUserLocation}
                  activeLayer={mapLayer}
                  showTraffic={showTraffic}
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
                        <div className={`price-display ${selectedStation.isBestForSelectedFuel && priceFilter === 'diesel' ? 'best-price' : ''} ${selectedStation.isOverallBestPrice && selectedStation.minPrice === selectedStation.diesel ? 'overall-best' : ''}`}>
                          <span className="fuel-type">Diesel</span>
                          <span className="fuel-price">€{selectedStation.diesel.toFixed(3)}</span>
                          {selectedStation.isBestForSelectedFuel && priceFilter === 'diesel' && (
                            <span className="best-price-badge">Best Price</span>
                          )}
                          {selectedStation.isOverallBestPrice && selectedStation.minPrice === selectedStation.diesel && priceFilter === 'all' && (
                            <span className="overall-best-badge">Overall Best</span>
                          )}
                        </div>
                        <div className={`price-display ${selectedStation.isBestForSelectedFuel && priceFilter === 'e5' ? 'best-price' : ''} ${selectedStation.isOverallBestPrice && selectedStation.minPrice === selectedStation.e5 ? 'overall-best' : ''}`}>
                          <span className="fuel-type">E5</span>
                          <span className="fuel-price">€{selectedStation.e5.toFixed(3)}</span>
                          {selectedStation.isBestForSelectedFuel && priceFilter === 'e5' && (
                            <span className="best-price-badge">Best Price</span>
                          )}
                          {selectedStation.isOverallBestPrice && selectedStation.minPrice === selectedStation.e5 && priceFilter === 'all' && (
                            <span className="overall-best-badge">Overall Best</span>
                          )}
                        </div>
                        <div className={`price-display ${selectedStation.isBestForSelectedFuel && priceFilter === 'e10' ? 'best-price' : ''} ${selectedStation.isOverallBestPrice && selectedStation.minPrice === selectedStation.e10 ? 'overall-best' : ''}`}>
                          <span className="fuel-type">E10</span>
                          <span className="fuel-price">€{selectedStation.e10.toFixed(3)}</span>
                          {selectedStation.isBestForSelectedFuel && priceFilter === 'e10' && (
                            <span className="best-price-badge">Best Price</span>
                          )}
                          {selectedStation.isOverallBestPrice && selectedStation.minPrice === selectedStation.e10 && priceFilter === 'all' && (
                            <span className="overall-best-badge">Overall Best</span>
                          )}
                        </div>
                      </div>
                      <button 
                        className="get-directions-btn"
                        onClick={() => getDirections(selectedStation)}
                      >
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
                  <div className="legend-item">
                    <div className="legend-color best-fuel"></div>
                    <span>Best Fuel Price</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color best-overall"></div>
                    <span>Best Overall Price</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // List View Layout
          <>
            {/* List View Sidebar (Filters only, no station cards) */}
            <ListViewSidebar
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              showOnlyOpen={showOnlyOpen}
              setShowOnlyOpen={setShowOnlyOpen}
              priceFilter={priceFilter}
              setPriceFilter={setPriceFilter}
              openStationsCount={openStationsCount}
              sortedStationsLength={sortedStations.length}
              averagePrice={averagePrice}
              bestPriceInfo={bestPriceInfo}
              selectedFuelType={priceFilter}
              onToggleSidebar={toggleSidebar}
              isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* List View Main Area */}
            <div className="list-view-container">
              <div className="list-view-header">
                <div className="list-view-title">
                  {isSidebarCollapsed && (
                    <button className="sidebar-toggle-btn-inline" onClick={toggleSidebar}>
                      <FaChevronRight />
                      <span>Show Filters</span>
                    </button>
                  )}
                  <h2>Gas Stations</h2>
                  <div className="list-stats">
                    <span>{sortedStations.length} stations • </span>
                    <span>{openStationsCount} open • </span>
                    <span>Sorted by {sortBy.replace('_', ' ')} ({sortDirection === 'low_to_high' ? 'Low to High' : 'High to Low'})</span>
                  </div>
                </div>
                
                <div className="list-view-actions">
                  <button 
                    className="list-action-btn"
                    onClick={getUserLocation}
                    disabled={isLocating}
                  >
                    <FaLocationArrow />
                    <span>{isLocating ? 'Updating...' : 'Refresh Location'}</span>
                  </button>
                  <button 
                    className="list-action-btn"
                    onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                  >
                    <FaFilter />
                    <span>{showOnlyOpen ? 'Show All' : 'Show Open Only'}</span>
                  </button>
                </div>
              </div>

              {/* Station Cards Grid Container */}
              <div className="list-view-content">
                <div className="stations-grid-container">
                  {sortedStations.length === 0 ? (
                    <div className="empty-state">
                      <FaGasPump className="empty-icon" />
                      <h3>No stations found</h3>
                      <p>Try adjusting your filters or search location</p>
                    </div>
                  ) : (
                    <div className="stations-grid">
                      {sortedStations.map((station) => (
                        <div key={station.id} className="station-grid-item">
                          <StationCard
                            station={station}
                            isSelected={selectedStation?.id === station.id}
                            onSelect={setSelectedStation}
                            sortBy={sortBy}
                            isBestForSelectedFuel={station.isBestForSelectedFuel || false}
                            isOverallBestPrice={station.isOverallBestPrice || false}
                            selectedFuelType={priceFilter}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* List View Footer Stats */}
              <div className="list-view-footer">
                <div className="list-stats-grid">
                  <div className="list-stat-item">
                    <div className="list-stat-label">Total Stations</div>
                    <div className="list-stat-value">{sortedStations.length}</div>
                  </div>
                  <div className="list-stat-item">
                    <div className="list-stat-label">Open Now</div>
                    <div className="list-stat-value">{openStationsCount}</div>
                  </div>
                  <div className="list-stat-item">
                    <div className="list-stat-label">
                      {priceFilter === 'all' ? 'Best Overall' : `Best ${priceFilter.toUpperCase()}`}
                    </div>
                    <div className="list-stat-value">
                      {bestPriceInfo ? 
                        `€${bestPriceInfo.price.toFixed(3)}` : 
                        'N/A'
                      }
                    </div>
                  </div>
                  <div className="list-stat-item">
                    <div className="list-stat-label">Avg Price</div>
                    <div className="list-stat-value">€{averagePrice}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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

      {/* Add CSS for best price features */}
      <style jsx>{`
        .stations-grid-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        
        .stations-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          padding: 0.5rem;
        }
        
        .station-grid-item {
          min-height: 0;
        }
        
        .list-view-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        
        @media (max-width: 1200px) {
          .stations-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .stations-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GasStationsList;