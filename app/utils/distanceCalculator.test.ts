import { calculateDistance } from './distanceCalculator';

describe('calculateDistance', () => {
  it('calculates distance between two points correctly', () => {
    // Berlin to Munich approximate distance
    const berlin = { lat: 52.5200, lon: 13.4050 };
    const munich = { lat: 48.1351, lon: 11.5820 };
    const distance = calculateDistance(berlin.lat, berlin.lon, munich.lat, munich.lon);
    expect(distance).toBeCloseTo(504, 0); // ~504 km
  });

  it('returns 0 for same coordinates', () => {
    const distance = calculateDistance(52.52, 13.405, 52.52, 13.405);
    expect(distance).toBe(0);
  });

  it('handles negative coordinates', () => {
    const distance = calculateDistance(-52.52, -13.405, 52.52, 13.405);
    expect(distance).toBeGreaterThan(0);
  });

  it('calculates small distances correctly', () => {
    // Two points 1 degree apart (~111 km at equator)
    const distance = calculateDistance(0, 0, 1, 0);
    expect(distance).toBeCloseTo(111, 0);
  });
});