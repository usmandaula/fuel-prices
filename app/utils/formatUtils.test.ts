import { 
  formatPrice, 
  formatDistance, 
  formatNumber, 
  isValidPrice, 
  getCheapestFuel 
} from './formatUtils';

describe('formatUtils', () => {
  describe('formatPrice', () => {
    test('formats valid price with 3 decimal places', () => {
      expect(formatPrice(1.549)).toBe('€1.549');
      expect(formatPrice(2)).toBe('€2.000');
      expect(formatPrice(1.9999)).toBe('€2.000');
    });

    test('returns N/A for invalid prices', () => {
      expect(formatPrice(null)).toBe('N/A');
      expect(formatPrice(undefined)).toBe('N/A');
      expect(formatPrice(NaN)).toBe('N/A');
    });
  });

  describe('formatDistance', () => {
    test('formats distance with 1 decimal place', () => {
      expect(formatDistance(2.5)).toBe('2.5 km');
      expect(formatDistance(10)).toBe('10.0 km');
      expect(formatDistance(0.3)).toBe('0.3 km');
    });

    test('returns N/A for invalid distances', () => {
      expect(formatDistance(null)).toBe('N/A');
      expect(formatDistance(undefined)).toBe('N/A');
      expect(formatDistance(NaN)).toBe('N/A');
    });
  });

  describe('formatNumber', () => {
    test('formats number with specified decimals', () => {
      expect(formatNumber(1.23456, 2)).toBe('1.23');
      expect(formatNumber(1.23456, 3)).toBe('1.235');
      expect(formatNumber(1000, 0)).toBe('1000');
    });

    test('returns N/A for invalid numbers', () => {
      expect(formatNumber(null)).toBe('N/A');
      expect(formatNumber(undefined)).toBe('N/A');
      expect(formatNumber(NaN)).toBe('N/A');
    });
  });

  describe('isValidPrice', () => {
    test('returns true for valid prices', () => {
      expect(isValidPrice(1.5)).toBe(true);
      expect(isValidPrice(0.01)).toBe(true);
      expect(isValidPrice(100)).toBe(true);
    });

    test('returns false for invalid prices', () => {
      expect(isValidPrice(null)).toBe(false);
      expect(isValidPrice(undefined)).toBe(false);
      expect(isValidPrice(NaN)).toBe(false);
      expect(isValidPrice(0)).toBe(false);
      expect(isValidPrice(-1)).toBe(false);
    });
  });

  describe('getCheapestFuel', () => {
    const mockStation = {
      diesel: 1.549,
      e5: 1.599,
      e10: 1.529
    };

    test('returns cheapest fuel type and price', () => {
      const result = getCheapestFuel(mockStation);
      expect(result.type).toBe('e10');
      expect(result.price).toBe(1.529);
    });

    test('handles null station', () => {
      const result = getCheapestFuel(null);
      expect(result.type).toBe('none');
      expect(result.price).toBe(0);
    });

    test('handles station with invalid prices', () => {
      const stationWithInvalidPrices = {
        diesel: null,
        e5: 1.599,
        e10: NaN
      };
      const result = getCheapestFuel(stationWithInvalidPrices);
      expect(result.type).toBe('e5');
      expect(result.price).toBe(1.599);
    });

    test('handles station with all invalid prices', () => {
      const stationWithAllInvalid = {
        diesel: null,
        e5: undefined,
        e10: NaN
      };
      const result = getCheapestFuel(stationWithAllInvalid);
      expect(result.type).toBe('none');
      expect(result.price).toBe(0);
    });
  });
});