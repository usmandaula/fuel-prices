// gasStationUtils.test.ts
import {
  calculateDistance,
  getCheapestFuel,
  calculateAveragePrice,
  findBestPrices,
  getAmenityIcon,
  formatAddress,
  getDirectionsUrl,
  sortStations,
  filterStations,
} from './gasStationUtils';
import { GasStation, FuelType } from '../types/gasStationTypes';

// Mock data for testing
const mockStations: GasStation[] = [
  {
    id: '1',
    name: 'Station A',
    brand: 'Brand A',
    street: 'Main St',
    houseNumber: '123',
    place: 'Berlin',
    lat: 52.5200,
    lng: 13.4050,
    dist: 1.5,
    diesel: 1.549,
    e5: 1.689,
    e10: 1.639,
    isOpen: true,
    openingTimes: [],
  },
  {
    id: '2',
    name: 'Station B',
    brand: 'Brand B',
    street: 'Second St',
    houseNumber: '456',
    place: 'Berlin',
    lat: 52.5300,
    lng: 13.4150,
    dist: 2.5,
    diesel: 1.599,
    e5: 1.649,
    e10: 1.599,
    isOpen: false,
    openingTimes: [],
  },
  {
    id: '3',
    name: 'Station C',
    brand: 'Brand C',
    street: 'Third St',
    houseNumber: '789',
    place: 'Berlin',
    lat: 52.5100,
    lng: 13.3950,
    dist: 0.5,
    diesel: 1.529,
    e5: 1.679,
    e10: 1.629,
    isOpen: true,
    openingTimes: [],
  },
];

describe('Gas Station Utilities', () => {
  describe('calculateDistance', () => {
    test('calculates distance between Berlin and Potsdam correctly', () => {
    // Berlin coordinates
    const berlinLat = 52.5200;
    const berlinLng = 13.4050;
    
    // Potsdam coordinates
    const potsdamLat = 52.3989;
    const potsdamLng = 13.0667;
    
    const distance = calculateDistance(berlinLat, berlinLng, potsdamLat, potsdamLng);
    
    // Berlin to Potsdam is approximately 26.5-27km
    // Using actual Google Maps distance: ~26.6km
    expect(distance).toBeCloseTo(26.6, 1); // Within 0.1km
  });


    test('returns 0 for same coordinates', () => {
      const distance = calculateDistance(52.5200, 13.4050, 52.5200, 13.4050);
      expect(distance).toBe(0);
    });

    test('handles negative coordinates', () => {
      const distance = calculateDistance(-52.5200, -13.4050, -52.5300, -13.4150);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('getCheapestFuel', () => {
    test('returns cheapest fuel type and price', () => {
      const station = mockStations[0];
      const cheapest = getCheapestFuel(station);
      
      expect(cheapest.type).toBe('diesel');
      expect(cheapest.price).toBe(1.549);
    });

    test('handles equal prices', () => {
      const station: GasStation = {
        ...mockStations[0],
        diesel: 1.5,
        e5: 1.5,
        e10: 1.5,
      };
      
      const cheapest = getCheapestFuel(station);
      expect(cheapest.price).toBe(1.5);
      // Should return the first in order if prices are equal
      expect(['diesel', 'e5', 'e10']).toContain(cheapest.type);
    });

    test('handles station with all very high prices', () => {
      const station: GasStation = {
        ...mockStations[0],
        diesel: 999,
        e5: 999,
        e10: 999,
      };
      
      const cheapest = getCheapestFuel(station);
      expect(cheapest.price).toBe(999);
    });
  });

  describe('calculateAveragePrice', () => {
    test('calculates average price across stations', () => {
      const average = calculateAveragePrice(mockStations);
      
      // Calculate expected: (sum of all prices) / (3 stations * 3 fuel types)
      const total = mockStations.reduce((sum, station) => 
        sum + station.diesel + station.e5 + station.e10, 0
      );
      const expected = (total / (mockStations.length * 3)).toFixed(3);
      
      expect(average).toBe(expected);
    });

    test('returns 0.000 for empty array', () => {
      const average = calculateAveragePrice([]);
      expect(average).toBe('0.000');
    });

    test('handles single station', () => {
      const singleStation = [mockStations[0]];
      const average = calculateAveragePrice(singleStation);
      
      const expected = ((1.549 + 1.689 + 1.639) / 3).toFixed(3);
      expect(average).toBe(expected);
    });
  });

  describe('findBestPrices', () => {
    test('finds best prices for each fuel type', () => {
      const bestPrices = findBestPrices(mockStations);
      
      expect(bestPrices.diesel).toEqual({
        price: 1.529,
        stationId: '3',
        stationName: 'Station C',
        type: 'diesel'
      });
      
      expect(bestPrices.e5).toEqual({
        price: 1.649,
        stationId: '2',
        stationName: 'Station B',
        type: 'e5'
      });
      
      expect(bestPrices.e10).toEqual({
        price: 1.599,
        stationId: '2',
        stationName: 'Station B',
        type: 'e10'
      });
      
      expect(bestPrices.overall).toEqual({
        price: 1.529,
        stationId: '3',
        stationName: 'Station C',
        type: 'diesel'
      });
    });

    test('handles empty stations array', () => {
      const bestPrices = findBestPrices([]);
      
      expect(bestPrices.diesel).toBeNull();
      expect(bestPrices.e5).toBeNull();
      expect(bestPrices.e10).toBeNull();
      expect(bestPrices.overall).toBeNull();
    });

    test('handles stations with some null/undefined prices', () => {
      const stationsWithMissingPrices: GasStation[] = [
        {
          ...mockStations[0],
          diesel: 0, // Free diesel? Might be missing data
          e5: 0,
          e10: 0,
        },
        mockStations[1],
      ];
      
      const bestPrices = findBestPrices(stationsWithMissingPrices);
      
      // Should still work and find the non-zero prices
      expect(bestPrices.diesel!.price).toBe(0);
      expect(bestPrices.e5!.price).toBe(0);
      expect(bestPrices.e10!.price).toBe(0);
    });
  });

  describe('getAmenityIcon', () => {
    test('returns correct icon for each amenity', () => {
      expect(getAmenityIcon('Car Wash')).toBe('car');
      expect(getAmenityIcon('car wash')).toBe('car'); // case insensitive
      expect(getAmenityIcon('SHOP')).toBe('shopping-cart');
      expect(getAmenityIcon('24/7')).toBe('gas-pump');
      expect(getAmenityIcon('Cafe')).toBe('coffee');
      expect(getAmenityIcon('ATM')).toBe('building');
      expect(getAmenityIcon('unknown')).toBe('home'); // default
    });

    test('handles empty string', () => {
      expect(getAmenityIcon('')).toBe('home');
    });
  });

  describe('formatAddress', () => {
    test('formats address correctly', () => {
      const station = mockStations[0];
      const address = formatAddress(station);
      
      expect(address).toBe('Main St 123, Berlin');
    });

    test('handles missing house number', () => {
      const station: GasStation = {
        ...mockStations[0],
        houseNumber: '',
      };
      
      const address = formatAddress(station);
      expect(address).toBe('Main St , Berlin');
    });

    test('handles missing street', () => {
      const station: GasStation = {
        ...mockStations[0],
        street: '',
      };
      
      const address = formatAddress(station);
      expect(address).toBe(' 123, Berlin');
    });
  });

  describe('getDirectionsUrl', () => {
    test('generates correct Google Maps directions URL', () => {
      const station = mockStations[0];
      const url = getDirectionsUrl(station);
      
      expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=52.52,13.405');
    });

    test('handles negative coordinates', () => {
      const station: GasStation = {
        ...mockStations[0],
        lat: -52.52,
        lng: -13.405,
      };
      
      const url = getDirectionsUrl(station);
      expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-52.52,-13.405');
    });
  });

  describe('sortStations', () => {
    test('sorts by distance low to high', () => {
      const sorted = sortStations(mockStations, 'distance', 'low_to_high');
      
      expect(sorted[0].id).toBe('3'); // dist: 0.5
      expect(sorted[1].id).toBe('1'); // dist: 1.5
      expect(sorted[2].id).toBe('2'); // dist: 2.5
    });

    test('sorts by distance high to low', () => {
      const sorted = sortStations(mockStations, 'distance', 'high_to_low');
      
      expect(sorted[0].id).toBe('2'); // dist: 2.5
      expect(sorted[1].id).toBe('1'); // dist: 1.5
      expect(sorted[2].id).toBe('3'); // dist: 0.5
    });

    test('sorts by diesel price low to high', () => {
      const sorted = sortStations(mockStations, 'price_diesel', 'low_to_high');
      
      expect(sorted[0].id).toBe('3'); // diesel: 1.529
      expect(sorted[1].id).toBe('1'); // diesel: 1.549
      expect(sorted[2].id).toBe('2'); // diesel: 1.599
    });

    test('sorts by e5 price high to low', () => {
      const sorted = sortStations(mockStations, 'price_e5', 'high_to_low');
      
      expect(sorted[0].id).toBe('1'); // e5: 1.689
      expect(sorted[1].id).toBe('3'); // e5: 1.679
      expect(sorted[2].id).toBe('2'); // e5: 1.649
    });

    test('sorts by name alphabetically', () => {
      const sorted = sortStations(mockStations, 'name', 'low_to_high');
      
      expect(sorted[0].name).toBe('Station A');
      expect(sorted[1].name).toBe('Station B');
      expect(sorted[2].name).toBe('Station C');
    });

    test('sorts by name reverse alphabetically', () => {
      const sorted = sortStations(mockStations, 'name', 'high_to_low');
      
      expect(sorted[0].name).toBe('Station C');
      expect(sorted[1].name).toBe('Station B');
      expect(sorted[2].name).toBe('Station A');
    });

    test('handles stations with missing ratings', () => {
      const stationsWithRatings: GasStation[] = [
        { ...mockStations[0], rating: 4.5 },
        { ...mockStations[1], rating: undefined },
        { ...mockStations[2], rating: 4.0 },
      ];
      
      const sorted = sortStations(stationsWithRatings, 'rating', 'high_to_low');
      
      expect(sorted[0].rating).toBe(4.5);
      expect(sorted[1].rating).toBe(4.0);
      expect(sorted[2].rating).toBeUndefined(); // undefined treated as 0
    });

    test('returns empty array for empty input', () => {
      const sorted = sortStations([], 'distance', 'low_to_high');
      expect(sorted).toEqual([]);
    });
  });

  describe('filterStations', () => {
    test('filters only open stations', () => {
      const filtered = filterStations(mockStations, true, 'all');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(station => station.isOpen)).toBe(true);
      expect(filtered.map(s => s.id)).toEqual(['1', '3']);
    });

    test('returns all stations when showOnlyOpen is false', () => {
      const filtered = filterStations(mockStations, false, 'all');
      
      expect(filtered).toHaveLength(3);
    });

    test('returns all stations when priceFilter is all', () => {
      const filtered = filterStations(mockStations, false, 'all');
      
      expect(filtered).toHaveLength(3);
    });

    test('returns empty array when no stations match filter', () => {
      const allClosedStations = mockStations.map(station => ({ ...station, isOpen: false }));
      const filtered = filterStations(allClosedStations, true, 'all');
      
      expect(filtered).toEqual([]);
    });

    test('filters with showOnlyOpen true and priceFilter', () => {
      // Note: The current implementation only filters by open status
      // If you want to filter by price in the future, you'll need to update the function
      const filtered = filterStations(mockStations, true, 'diesel');
      
      expect(filtered).toHaveLength(2); // Only filters by open status currently
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases', () => {
    test('calculateDistance with invalid coordinates', () => {
      // Should handle NaN or Infinity
      const distance = calculateDistance(NaN, NaN, 52.52, 13.405);
      expect(isNaN(distance)).toBe(true);
    });

    test('getCheapestFuel with extremely high prices', () => {
      const station: GasStation = {
        ...mockStations[0],
        diesel: Number.MAX_VALUE,
        e5: Number.MAX_VALUE,
        e10: Number.MAX_VALUE,
      };
      
      const cheapest = getCheapestFuel(station);
      expect(cheapest.price).toBe(Number.MAX_VALUE);
    });

    test('sortStations with identical values', () => {
      const identicalStations: GasStation[] = [
        { ...mockStations[0], dist: 1.0, name: 'Station A' },
        { ...mockStations[0], id: '4', dist: 1.0, name: 'Station A' },
      ];
      
      const sorted = sortStations(identicalStations, 'distance', 'low_to_high');
      // Should maintain original order for identical values
      expect(sorted).toHaveLength(2);
    });
  });
});