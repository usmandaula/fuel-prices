import { useState, useCallback, useMemo } from 'react';
import { calculateDistance } from '../utils/distanceCalculator';
import { 
  GasStation, 
  SortOption, 
  SortDirection, 
  MapLayer,
  FuelType,
  BestPriceInfo 
} from '../types/gasStationTypes';

export const useDataProcessing = (data: any, userLocation: any, viewMode: 'list' | 'map') => {
  // State declarations
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('low_to_high');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'diesel' | 'e5' | 'e10'>('all');
  const [mapLayer, setMapLayer] = useState<MapLayer>('standard');
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);

  /**
   * Processes station data with distances and additional info
   */
  const stationsWithDistances = useMemo(() => {
    if (!data?.stations) return [];
    
    return data.stations.map((station: any) => {
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
  }, [data?.stations, userLocation]);

  /**
   * Finds best prices for each fuel type across all stations
   */
  const bestPrices = useMemo(() => {
    let bestDiesel: BestPriceInfo | null = null;
    let bestE5: BestPriceInfo | null = null;
    let bestE10: BestPriceInfo | null = null;
    let bestOverall: BestPriceInfo | null = null;
    
    stationsWithDistances.forEach((station: any) => {
      if (!station) return;
      
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
    return stationsWithDistances.map((station: any) => {
      const isOverallBestPrice = station.id === bestPrices.overall?.stationId;
      
      // Check if station has best price for currently selected fuel type
      let isBestForSelectedFuel = false;
      if (priceFilter !== 'all') {
        const bestPriceForFuel = bestPrices[priceFilter as keyof typeof bestPrices];
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
      filtered = filtered.filter((station: any) => station.isOpen);
    }

    // Then apply sorting
    const sorted = [...filtered].sort((a: any, b: any) => {
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
          ? String(valueA).localeCompare(String(valueB))
          : String(valueB).localeCompare(String(valueA));
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
    sortedStations.filter((s: any) => s.isOpen).length,
    [sortedStations]
  );

  const averagePrice = useMemo(() => 
    sortedStations.length > 0 
      ? (sortedStations.reduce((sum: number, s: any) => sum + s.diesel + s.e5 + s.e10, 0) / (sortedStations.length * 3)).toFixed(3)
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

        const station = sortedStations.find((s: any) => s.id === stationId);
        if (station) {
          setSelectedStation(station);
        }
      }
    } else {
      const station = sortedStations.find((s: any) => s.id === stationId);
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
    const station = sortedStations.find((s: any) => s.id === stationId);
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

  /**
   * Gets directions to a station using Google Maps
   */
  const getDirections = useCallback((station: GasStation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, '_blank');
  }, []);

  return {
    sortedStations,
    filteredStations,
    selectedStation,
    setSelectedStation,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    showOnlyOpen,
    setShowOnlyOpen,
    priceFilter,
    setPriceFilter,
    openStationsCount,
    averagePrice,
    bestPrices,
    handleBestPriceClick,
    scrollToStation,
    mapLayer,
    setMapLayer,
    showTraffic,
    setShowTraffic,
    mapZoom,
    setMapZoom,
    getDirections
  };
};