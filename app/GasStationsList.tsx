"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  FaTrophy,
  FaArrowRight,
  FaExternalLinkAlt,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import axios from 'axios';

// Import components
import EnhancedSearch from './components/EnhancedSearch';
import StationCard from './components/StationCard';
import MapControls from './components/MapControls';
import ClickableStats from './components/ClickableStats';
import ListViewSidebar from './components/ListViewSidebar';
import MapViewSidebar from './components/MapViewSidebar';
import DarkModeToggle from './components/DarkModeToggle';

// Import types
import { 
  GasStation, 
  GasStationData, 
  GasStationsListProps,
  SortOption, 
  SortDirection, 
  MapLayer, 
  FuelType,
  BestPriceInfo
} from './types/gasStationTypes';

// Dynamically import the enhanced map component (reduces initial bundle size)
const DetailedMapView = dynamic(() => import('./DetailedMapView'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="map-spinner"></div>
      <p>Loading detailed map...</p>
    </div>
  )
});

// ========================================================
// UTILITY FUNCTIONS
// ========================================================

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// ========================================================
// MAIN COMPONENT: GasStationsList
// ========================================================
/**
 * Main component that displays gas stations in either list or map view
 * Handles state management, filtering, sorting, and user interactions
 */
const GasStationsList: React.FC<GasStationsListProps> = ({ 
  data, 
  initialUserLocation,
    onLocationSearch, 
    radius,
  onRadiusChange 
 
}) => {
  // ========================================================
  // STATE MANAGEMENT
  // ========================================================
  
  // Station and selection state
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  
  // View and layout state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Location state
  const [userLocation, setUserLocation] = useState<{ 
    lat: number; 
    lng: number; 
    name?: string 
  } | undefined>(initialUserLocation);
  const [searchedLocation, setSearchedLocation] = useState<{ 
    lat: number; 
    lng: number; 
    name: string 
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Filter and sorting state
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('low_to_high');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'diesel' | 'e5' | 'e10'>('all');
  
  // Map control state
  const [mapLayer, setMapLayer] = useState<MapLayer>('standard');
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  
  // Refs for scrolling
  const stationsGridRef = useRef<HTMLDivElement>(null);
  const stationsListRef = useRef<HTMLDivElement>(null);

  // ========================================================
  // EFFECTS AND INITIALIZATION
  // ========================================================

  /**
   * Gets user's current geolocation
   */
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

   /**
   * Handles location search results
   */
  const handleLocationFound = (location: { lat: number; lng: number; name: string }) => {
    setSearchedLocation(location);
    setUserLocation(location);
    
    // Notify parent component about the search
    if (onLocationSearch) {
      onLocationSearch(location);
    }
  };

  /**
   * Toggles sidebar collapse state
   */
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  /**
   * Toggles dark/light mode
   */
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  /**
   * Gets directions to a station using Google Maps
   */
  const getDirections = (station: GasStation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, '_blank');
  };

  // Initialize component
  useEffect(() => {
    if (!initialUserLocation && !searchedLocation) {
      getUserLocation();
    }

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, [getUserLocation, initialUserLocation, searchedLocation]);

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // ========================================================
  // DATA PROCESSING AND MEMOIZATION
  // ========================================================

  /**
   * Processes station data with distances and additional info
   */
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
          rating: Math.random() * 2 + 3, // Mock rating for demo
          amenities: ['24/7', 'Car Wash', 'Shop', 'ATM'].slice(0, Math.floor(Math.random() * 4) + 1)
        };
      }
      const minPrice = Math.min(station.diesel, station.e5, station.e10);
      return { ...station, minPrice };
    });
  }, [data.stations, userLocation]);

  /**
   * Finds best prices for each fuel type across all stations
   */
// In GasStationsList.tsx, update the bestPrices calculation:
const bestPrices = useMemo(() => {
  let bestDiesel: BestPriceInfo | null = null;
  let bestE5: BestPriceInfo | null = null;
  let bestE10: BestPriceInfo | null = null;
  let bestOverall: BestPriceInfo | null = null;
  
  stationsWithDistances.forEach(station => {
    if (!station) return;
    
    // Only consider stations with valid prices (> 0)
    
    // Diesel best price
    if (station.diesel > 0 && (!bestDiesel || station.diesel < bestDiesel.price)) {
      bestDiesel = {
        price: station.diesel,
        stationId: station.id,
        stationName: station.name,
        type: 'diesel'
      };
    }
    
    // E5 best price
    if (station.e5 > 0 && (!bestE5 || station.e5 < bestE5.price)) {
      bestE5 = {
        price: station.e5,
        stationId: station.id,
        stationName: station.name,
        type: 'e5'
      };
    }
    
    // E10 best price
    if (station.e10 > 0 && (!bestE10 || station.e10 < bestE10.price)) {
      bestE10 = {
        price: station.e10,
        stationId: station.id,
        stationName: station.name,
        type: 'e10'
      };
    }
    
    // Overall best price (minimum of all valid prices)
    const validPrices = [
      station.diesel > 0 ? { price: station.diesel, type: 'diesel' } : null,
      station.e5 > 0 ? { price: station.e5, type: 'e5' } : null,
      station.e10 > 0 ? { price: station.e10, type: 'e10' } : null
    ].filter(Boolean) as { price: number; type: string }[];
    
    if (validPrices.length > 0) {
      const minStationPrice = Math.min(...validPrices.map(p => p.price));
      const minPriceType = validPrices.find(p => p.price === minStationPrice)?.type || 'diesel';
      
      if (!bestOverall || minStationPrice < bestOverall.price) {
        bestOverall = {
          price: minStationPrice,
          stationId: station.id,
          stationName: station.name,
          type: minPriceType as any
        };
      }
    }
  });

  return { 
    diesel: bestDiesel, 
    e5: bestE5, 
    e10: bestE10, 
    overall: bestOverall 
  };
}, [stationsWithDistances]);

  /**
   * Processes stations with best price flags
   */
  const processedStations = useMemo(() => {
    return stationsWithDistances.map(station => {
      const isOverallBestPrice = station.id === bestPrices.overall?.stationId;
      
      // Check if station has best price for currently selected fuel type
      let isBestForSelectedFuel = false;
      if (priceFilter !== 'all') {
        const bestPriceForFuel = bestPrices[priceFilter];
        isBestForSelectedFuel = bestPriceForFuel?.stationId === station.id;
      }

      return {
        ...station,
        isOverallBestPrice,
        isBestForSelectedFuel
      };
    });
  }, [stationsWithDistances, bestPrices, priceFilter]);

  /**
   * Filters and sorts stations based on current settings
   */
  const { filteredStations, sortedStations } = useMemo(() => {
    // First apply filters
    let filtered = [...processedStations];
    
    if (showOnlyOpen) {
      filtered = filtered.filter(station => station.isOpen);
    }

    // Then apply sorting
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

      // Apply sort direction
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'low_to_high' ? valueA - valueB : valueB - valueA;
      } else {
        return sortDirection === 'low_to_high' 
          ? valueA.localeCompare(valueB as string)
          : (valueB as string).localeCompare(valueA);
      }
    });

    return { 
      filteredStations: filtered, 
      sortedStations: sorted 
    };
  }, [processedStations, showOnlyOpen, sortBy, sortDirection]);

  /**
   * Statistics derived from sorted stations
   */
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

  // ========================================================
  // EVENT HANDLERS
  // ========================================================

  /**
   * Scrolls to a station and highlights it
   */
  const scrollToStation = useCallback((stationId: string) => {
    if (viewMode === 'list') {
      const element = document.getElementById(`station-${stationId}`);
      if (element) {
        element.classList.add('highlighted');
        setTimeout(() => {
          element.classList.remove('highlighted');
        }, 2000);

        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });

        const station = sortedStations.find(s => s.id === stationId);
        if (station) {
          setSelectedStation(station);
        }
      }
    } else {
      const station = sortedStations.find(s => s.id === stationId);
      if (station) {
        setSelectedStation(station);
        
        const stationElement = document.getElementById(`station-${stationId}`);
        if (stationElement) {
          stationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          stationElement.classList.add('highlighted');
          setTimeout(() => stationElement.classList.remove('highlighted'), 2000);
        }
      }
    }
  }, [sortedStations, viewMode]);

  /**
   * Handles clicks on best price statistics
   */
  const handleBestPriceClick = useCallback((stationId: string, fuelType?: FuelType) => {
    const station = sortedStations.find(s => s.id === stationId);
    if (!station) return;

    setSelectedStation(station);

    if (viewMode === 'list') {
      // List view: scroll to station
      const element = document.getElementById(`station-${stationId}`);
      if (element) {
        element.classList.add('highlighted');
        setTimeout(() => element.classList.remove('highlighted'), 2000);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Map view: fly to station using custom event
      const flyToEvent = new CustomEvent('flyToStation', {
        detail: {
          lat: station.lat,
          lng: station.lng,
          stationId: station.id,
          fuelType: fuelType
        }
      });
      window.dispatchEvent(flyToEvent);
      
      // Visual feedback
      const stationElement = document.getElementById(`station-${stationId}`);
      if (stationElement) {
        stationElement.classList.add('highlighted');
        setTimeout(() => stationElement.classList.remove('highlighted'), 3000);
      }
    }
  }, [sortedStations, viewMode]);

  // ========================================================
  // RENDER LOGIC
  // ========================================================

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

  // Render main component
  return (
    <div className={`gas-stations-app-enhanced ${isDarkMode ? 'dark' : ''}`}>
      {/* Top Navigation */}
      <nav className="app-nav">
        <div className="nav-left">
          
        </div>
        
        <div className="nav-center">
          <EnhancedSearch 
            onLocationFound={handleLocationFound}
            currentLocation={userLocation}
          />
        </div>
        
        <div className="nav-right">
          <div className="nav-actions">
            <DarkModeToggle 
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
            />
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
        </div>
      </nav>

      {/* Main Content Area - Conditional rendering based on view mode */}
      <main className="app-main">
        {viewMode === 'map' ? (
          // MAP VIEW LAYOUT
          <MapViewLayout
            sortedStations={sortedStations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            userLocation={userLocation}
            searchedLocation={searchedLocation}
            sortBy={sortBy}
            sortDirection={sortDirection}
            setSortBy={setSortBy}
            setSortDirection={setSortDirection}
            showOnlyOpen={showOnlyOpen}
            setShowOnlyOpen={setShowOnlyOpen}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            openStationsCount={openStationsCount}
            averagePrice={averagePrice}
            bestPrices={bestPrices}
            handleBestPriceClick={handleBestPriceClick}
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            isDarkMode={isDarkMode}
            mapLayer={mapLayer}
            showTraffic={showTraffic}
            setMapLayer={setMapLayer}
            setShowTraffic={setShowTraffic}
            getUserLocation={getUserLocation}
            mapZoom={mapZoom}
            setMapZoom={setMapZoom}
            getDirections={getDirections}
            radius={radius}
  onRadiusChange={onRadiusChange}
          />
        ) : (
          // LIST VIEW LAYOUT
          <ListViewLayout
            sortedStations={sortedStations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            sortBy={sortBy}
            sortDirection={sortDirection}
            setSortBy={setSortBy}
            setSortDirection={setSortDirection}
            showOnlyOpen={showOnlyOpen}
            setShowOnlyOpen={setShowOnlyOpen}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            openStationsCount={openStationsCount}
            averagePrice={averagePrice}
            bestPrices={bestPrices}
            handleBestPriceClick={handleBestPriceClick}
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            isDarkMode={isDarkMode}
            isLocating={isLocating}
            getUserLocation={getUserLocation}
            scrollToStation={scrollToStation}
            radius={radius}
  onRadiusChange={onRadiusChange}
          />
        )}
      </main>

      {/* Bottom Info Bar */}
      <Footer 
        userLocation={userLocation}
        isLocating={isLocating}
        dataSource={data.data}
        getUserLocation={getUserLocation}
      />
    </div>
  );
};

// ========================================================
// SUB-COMPONENTS FOR BETTER ORGANIZATION
// ========================================================

/**
 * Map View Layout Component
 * Handles all map-specific UI and interactions
 */
interface MapViewLayoutProps {
  sortedStations: GasStation[];
  selectedStation: GasStation | null;
  setSelectedStation: (station: GasStation | null) => void;
  userLocation: { lat: number; lng: number; name?: string } | undefined;
  searchedLocation: { lat: number; lng: number; name: string } | null;
  sortBy: SortOption;
  sortDirection: SortDirection;
  setSortBy: (option: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  setPriceFilter: (filter: 'all' | 'diesel' | 'e5' | 'e10') => void;
  openStationsCount: number;
  averagePrice: string;
  bestPrices: {
    diesel: BestPriceInfo | null;
    e5: BestPriceInfo | null;
    e10: BestPriceInfo | null;
    overall: BestPriceInfo | null;
  };
  handleBestPriceClick: (stationId: string, fuelType?: FuelType) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isDarkMode: boolean;
  mapLayer: MapLayer;
  showTraffic: boolean;
  setMapLayer: (layer: MapLayer) => void;
  setShowTraffic: (show: boolean) => void;
  getUserLocation: () => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;
  getDirections: (station: GasStation) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  
}

const MapViewLayout: React.FC<MapViewLayoutProps> = ({
  sortedStations,
  selectedStation,
  setSelectedStation,
  userLocation,
  searchedLocation,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
  showOnlyOpen,
  setShowOnlyOpen,
  priceFilter,
  setPriceFilter,
  openStationsCount,
  averagePrice,
  bestPrices,
  handleBestPriceClick,
  isSidebarCollapsed,
  toggleSidebar,
  isDarkMode,
  mapLayer,
  showTraffic,
  setMapLayer,
  setShowTraffic,
  getUserLocation,
  mapZoom,
  setMapZoom,
  getDirections,
  radius,
  onRadiusChange
  


}) => {
  return (
    <>
      {/* Map View Sidebar (Filters only) */}
      <MapViewSidebar
        
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
        bestPrices={bestPrices}
        selectedFuelType={priceFilter}
        onPriceClick={handleBestPriceClick}
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        isDarkMode={isDarkMode}
        viewMode="map"
        radius={radius} // Make sure radius is available here
        onRadiusChange={onRadiusChange} // And this
      />

      {/* Map Area */}
      <div className="app-map-area">
        <div className="map-container">
          <DetailedMapView
            stations={sortedStations}
            selectedStation={selectedStation}
            userLocation={userLocation}
            onStationSelect={(station) => {
              setSelectedStation(station);
            }}
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
            <SelectedStationOverlay
              station={selectedStation}
              priceFilter={priceFilter}
              onClose={() => setSelectedStation(null)}
              onGetDirections={() => getDirections(selectedStation)}
            />
          )}
        </div>

        {/* Map Legend */}
        <MapLegend />
      </div>
    </>
  );
};

/**
 * List View Layout Component
 * Handles all list-specific UI and interactions
 */
interface ListViewLayoutProps {
  sortedStations: GasStation[];
  selectedStation: GasStation | null;
  setSelectedStation: (station: GasStation | null) => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  setSortBy: (option: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  setPriceFilter: (filter: 'all' | 'diesel' | 'e5' | 'e10') => void;
  openStationsCount: number;
  averagePrice: string;
  bestPrices: {
    diesel: BestPriceInfo | null;
    e5: BestPriceInfo | null;
    e10: BestPriceInfo | null;
    overall: BestPriceInfo | null;
  };
  handleBestPriceClick: (stationId: string, fuelType?: FuelType) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isDarkMode: boolean;
  isLocating: boolean;
  getUserLocation: () => void;
  scrollToStation: (stationId: string) => void;
  radius:number;
    onRadiusChange: (radius: number) => void;
  
}

const ListViewLayout: React.FC<ListViewLayoutProps> = ({
  sortedStations,
  selectedStation,
  setSelectedStation,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
  showOnlyOpen,
  setShowOnlyOpen,
  priceFilter,
  setPriceFilter,
  openStationsCount,
  averagePrice,
  bestPrices,
  handleBestPriceClick,
  isSidebarCollapsed,
  toggleSidebar,
  isDarkMode,
  isLocating,
  getUserLocation,
  scrollToStation,
  radius,
  onRadiusChange
}) => {
  return (
    <>
      {/* List View Sidebar (Filters only) */}
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
        bestPrices={bestPrices}
        selectedFuelType={priceFilter}
        onPriceClick={handleBestPriceClick}
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        isDarkMode={isDarkMode}
        viewMode="list"
        radius={radius}
  onRadiusChange={onRadiusChange}
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
              <span><b>Total Stations • {sortedStations.length}  </b></span>
              <span><b>Open • {openStationsCount}  </b></span>
              <span><b>Sorted by {sortBy.replace('_', ' ')} ({sortDirection === 'low_to_high' ? 'Low to High' : 'High to Low'})</b></span>
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
          {/* Radius Selector for List View */}
<div className="radius-selector-list">
  <div className="radius-header">
    <FaRuler className="radius-icon" />
    <span className="radius-label">Radius</span>
    <span className="current-radius">{radius}km</span>
  </div>
  
  <div className="radius-buttons">
    {[1, 3, 5, 10, 15, 25].map((r) => (
      <button
        key={r}
        className={`radius-btn ${radius === r ? 'active' : ''}`}
        onClick={() => onRadiusChange && onRadiusChange(r)}
        title={`Search within ${r} kilometers`}
      >
        {r}
        <span className="unit">km</span>
      </button>
    ))}
  </div>
</div>
          </div>
          
        </div>
        

        {/* Station Cards Grid */}
        <div className="list-view-content">
          <div className="stations-grid-container">
            {sortedStations.length === 0 ? (
              <EmptyState />
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
                      scrollToStation={scrollToStation}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* List View Footer Stats */}
        {/* <div className="list-view-footer">
          <ClickableStats
            bestPrices={bestPrices}
            onPriceClick={handleBestPriceClick}
            openStationsCount={openStationsCount}
            sortedStationsLength={sortedStations.length}
            averagePrice={averagePrice}
            selectedFuelType={priceFilter}
            isMapView={false}
          />
        </div> */}
      </div>
    </>
  );
};

/**
 * Selected Station Overlay Component for Map View
 */
interface SelectedStationOverlayProps {
  station: GasStation;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  onClose: () => void;
  onGetDirections: () => void;
}

const SelectedStationOverlay: React.FC<SelectedStationOverlayProps> = ({
  station,
  priceFilter,
  onClose,
  onGetDirections
}) => {
  return (
    <div className="selected-overlay">
      <div className="overlay-header">
        <h3>{station.name}</h3>
        <button 
          className="close-overlay"
          onClick={onClose}
        >
          <FaTimes />
        </button>
      </div>
      <div className="overlay-content">
        <div className="overlay-prices">
          <PriceDisplay 
            fuelType="Diesel"
            price={station.diesel}
            isBestPrice={station.isBestForSelectedFuel && priceFilter === 'diesel'}
            isOverallBest={station.isOverallBestPrice && station.minPrice === station.diesel && priceFilter === 'all'}
          />
          <PriceDisplay 
            fuelType="E5"
            price={station.e5}
            isBestPrice={station.isBestForSelectedFuel && priceFilter === 'e5'}
            isOverallBest={station.isOverallBestPrice && station.minPrice === station.e5 && priceFilter === 'all'}
          />
          <PriceDisplay 
            fuelType="E10"
            price={station.e10}
            isBestPrice={station.isBestForSelectedFuel && priceFilter === 'e10'}
            isOverallBest={station.isOverallBestPrice && station.minPrice === station.e10 && priceFilter === 'all'}
          />
        </div>
        <button 
          className="get-directions-btn"
          onClick={onGetDirections}
        >
          <FaRoute />
          Get Directions ({station.dist.toFixed(1)} km)
        </button>
      </div>
    </div>
  );
};

/**
 * Price Display Component for Selected Station Overlay
 */
interface PriceDisplayProps {
  fuelType: string;
  price: number;
  isBestPrice: boolean;
  isOverallBest: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  fuelType,
  price,
  isBestPrice,
  isOverallBest
}) => {
  return (
    <div className={`price-display ${isBestPrice ? 'best-price' : ''} ${isOverallBest ? 'overall-best' : ''}`}>
      <span className="fuel-type">{fuelType}</span>
      <span className="fuel-price">€{price.toFixed(3)}</span>
      {isBestPrice && (
        <span className="best-price-badge">Best Price</span>
      )}
      {isOverallBest && (
        <span className="overall-best-badge">Overall Best</span>
      )}
    </div>
  );
};

/**
 * Map Legend Component
 */
const MapLegend: React.FC = () => {
  return (
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
  );
};

/**
 * Empty State Component for when no stations are found
 */
const EmptyState: React.FC = () => {
  return (
    <div className="empty-state">
      <FaGasPump className="empty-icon" />
      <h3>No stations found</h3>
      <p>Try adjusting your filters or search location</p>
    </div>
  );
};

/**
 * Footer Component
 */
interface FooterProps {
  userLocation: { lat: number; lng: number; name?: string } | undefined;
  isLocating: boolean;
  dataSource: string;
  getUserLocation: () => void;
}

const Footer: React.FC<FooterProps> = ({
  userLocation,
  isLocating,
  dataSource,
  getUserLocation
}) => {
  return (
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
          <span className="data-source">Data: {dataSource} • Map: OpenStreetMap</span>
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
  );
};

export default GasStationsList;