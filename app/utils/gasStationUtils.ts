import { GasStation, FuelType, BestPriceInfo } from '../types/gasStationTypes';

/**
 * Calculates distance between two coordinates using Haversine formula
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

/**
 * Gets the cheapest fuel type for a station
 */
export const getCheapestFuel = (station: GasStation): { type: FuelType; price: number } => {
  const fuels = [
    { type: 'diesel' as const, price: station.diesel },
    { type: 'e5' as const, price: station.e5 },
    { type: 'e10' as const, price: station.e10 }
  ];
  return fuels.reduce((cheapest, fuel) => 
    fuel.price < cheapest.price ? fuel : cheapest
  );
};

/**
 * Calculates average price across all stations
 */
export const calculateAveragePrice = (stations: GasStation[]): string => {
  if (stations.length === 0) return '0.000';
  
  const total = stations.reduce((sum, station) => 
    sum + station.diesel + station.e5 + station.e10, 0
  );
  
  return (total / (stations.length * 3)).toFixed(3);
};

/**
 * Finds best prices for each fuel type
 */
export const findBestPrices = (stations: GasStation[]) => {
  let bestDiesel: BestPriceInfo | null = null;
  let bestE5: BestPriceInfo | null = null;
  let bestE10: BestPriceInfo | null = null;
  let bestOverall: BestPriceInfo | null = null;
  
  stations.forEach(station => {
    // Diesel
    if (!bestDiesel || station.diesel < bestDiesel.price) {
      bestDiesel = {
        price: station.diesel,
        stationId: station.id,
        stationName: station.name,
        type: 'diesel' as const
      };
    }
    
    // E5
    if (!bestE5 || station.e5 < bestE5.price) {
      bestE5 = {
        price: station.e5,
        stationId: station.id,
        stationName: station.name,
        type: 'e5' as const
      };
    }
    
    // E10
    if (!bestE10 || station.e10 < bestE10.price) {
      bestE10 = {
        price: station.e10,
        stationId: station.id,
        stationName: station.name,
        type: 'e10' as const
      };
    }
    
    // Overall
    const minStationPrice = Math.min(station.diesel, station.e5, station.e10);
    if (!bestOverall || minStationPrice < bestOverall.price) {
      bestOverall = {
        price: minStationPrice,
        stationId: station.id,
        stationName: station.name,
        type: station.diesel === minStationPrice ? 'diesel' : 
              station.e5 === minStationPrice ? 'e5' : 'e10'
      };
    }
  });

  return { 
    diesel: bestDiesel, 
    e5: bestE5, 
    e10: bestE10, 
    overall: bestOverall 
  };
};

/**
 * Gets amenity icon type based on amenity name
 */
export const getAmenityIcon = (amenity: string): string => {
  switch (amenity.toLowerCase()) {
    case 'car wash': return 'car';
    case 'shop': return 'shopping-cart';
    case '24/7': return 'gas-pump';
    case 'cafe': return 'coffee';
    case 'atm': return 'building';
    default: return 'home';
  }
};

/**
 * Formats station address
 */
export const formatAddress = (station: GasStation): string => {
  return `${station.street} ${station.houseNumber}, ${station.place}`;
};

/**
 * Gets directions URL for a station
 */
export const getDirectionsUrl = (station: GasStation): string => {
  return `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
};

/**
 * Sorts stations based on criteria and direction
 */
export const sortStations = (
  stations: GasStation[],
  sortBy: 'distance' | 'price_diesel' | 'price_e5' | 'price_e10' | 'name' | 'rating',
  sortDirection: 'low_to_high' | 'high_to_low'
): GasStation[] => {
  return [...stations].sort((a, b) => {
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
};

/**
 * Filters stations based on criteria
 */
export const filterStations = (
  stations: GasStation[],
  showOnlyOpen: boolean,
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10'
): GasStation[] => {
  let filtered = [...stations];
  
  if (showOnlyOpen) {
    filtered = filtered.filter(station => station.isOpen);
  }

  return filtered;
};

// Export all utility functions
export default {
  calculateDistance,
  getCheapestFuel,
  calculateAveragePrice,
  findBestPrices,
  getAmenityIcon,
  formatAddress,
  getDirectionsUrl,
  sortStations,
  filterStations
};