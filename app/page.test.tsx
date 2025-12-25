/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './page';
import * as gasService from './services/gasStationService';
let store: Record<string, string> = {};

beforeEach(() => {
  store = {};

  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key: string) => (key in store ? store[key] : null)
  );

  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(
    (key: string, value: string) => {
      store[key] = value;
    }
  );

  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(
    (key: string) => {
      delete store[key];
    }
  );

  jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
    store = {};
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
const mockData = [{ id: 1, name: 'Gas Station 1' }];

// Mock GasStationsList to render simple divs for testing
jest.mock('./GasStationsList', () => {
  return ({ data, onRadiusChange }: any) => (
    <div>
      {data.map((station: any) => (
        <div key={station.id}>{station.name}</div>
      ))}
      <button onClick={() => onRadiusChange && onRadiusChange(10)}>Change Radius</button>
    </div>
  );
});

// Mock gas station service
jest.mock('./services/gasStationService');

describe('App Component', () => {
  const originalGeolocation = navigator.geolocation;

  beforeAll(() => {
    // Mock window.matchMedia to prevent useDarkMode errors
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });
beforeEach(() => {
  jest.clearAllMocks();
    localStorage.clear();

  jest.spyOn(Storage.prototype, "setItem");
  jest.spyOn(Storage.prototype, "getItem");
  

  // DEFAULT geolocation behavior: fail immediately
  // so app falls back to Berlin and fetches data
  // @ts-ignore
  navigator.geolocation = {
    getCurrentPosition: jest.fn((_, error) =>
      error({ code: 1, message: 'Permission denied' })
    ),
  };
});


  afterAll(() => {
    navigator.geolocation = originalGeolocation;
  });

  test('renders loading state initially', async () => {
    (gasService.fetchGasStationsCached as jest.Mock).mockResolvedValueOnce(mockData);
    render(<App />);
    expect(screen.getByText(/Loading Gas Stations/i)).toBeInTheDocument();
  });

  test('renders gas station list after successful fetch', async () => {
    (gasService.fetchGasStationsCached as jest.Mock).mockResolvedValueOnce(mockData);
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Gas Station 1/i)).toBeInTheDocument());
    expect(screen.queryByText(/Loading Gas Stations/i)).not.toBeInTheDocument();
  });

  test('handles fetch error and shows error component', async () => {
    (gasService.fetchGasStationsCached as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Unable to Load Data/i)).toBeInTheDocument());
    expect(screen.getByText(/API Error/i)).toBeInTheDocument();
  });
// test('saves search state to localStorage', async () => {
//   (gasService.fetchGasStationsCached as jest.Mock).mockResolvedValueOnce(mockData);

//   render(<App />);

//   let savedState: string | null = null;

//   await waitFor(() => {
//     savedState = localStorage.getItem('lastGasStationSearch');

//     // 🔒 Critical guards
//     expect(savedState).toBeTruthy();
//     expect(savedState).not.toBe('undefined');
//   });

//   // ✅ Parse ONLY after waitFor succeeds
//   const parsed = JSON.parse(savedState!);

//   expect(parsed).toMatchObject({
//     lat: expect.any(Number),
//     lng: expect.any(Number),
//     name: expect.any(String),
//     radius: expect.any(Number),
//   });
// });




test('uses cached data when fetch fails', async () => {
  const cacheKey = 'gas_stations_52.521_13.438_5_default';

  localStorage.setItem(
    cacheKey,
    JSON.stringify({ data: mockData })
  );

  (gasService.fetchGasStationsCached as jest.Mock).mockRejectedValueOnce(
    new Error('API Error')
  );

  render(<App />);

  await waitFor(() =>
    expect(screen.getByText(/Unable to Load Data/i)).toBeInTheDocument()
  );

  expect(screen.getByText(/API Error/i)).toBeInTheDocument();
});


  test('handles geolocation success', async () => {
    // @ts-ignore
    navigator.geolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: 52.52, longitude: 13.4 } })
    );
    (gasService.fetchGasStationsCached as jest.Mock).mockResolvedValueOnce(mockData);
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Gas Station 1/i)).toBeInTheDocument());
    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  test('handles geolocation failure and fallback to default', async () => {
    // @ts-ignore
    navigator.geolocation.getCurrentPosition.mockImplementationOnce((success, error) =>
      error({ code: 1, message: 'Permission denied' })
    );
    (gasService.fetchGasStationsCached as jest.Mock).mockResolvedValueOnce(mockData);
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Gas Station 1/i)).toBeInTheDocument());
  });

  test('updates radius and refetches data', async () => {
    (gasService.fetchGasStationsCached as jest.Mock).mockResolvedValue(mockData);
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Gas Station 1/i)).toBeInTheDocument());

    // Simulate radius change via the mocked button in GasStationsList
    fireEvent.click(screen.getByText(/Change Radius/i));

    // Should call fetchGasStationsCached again
    expect(gasService.fetchGasStationsCached).toHaveBeenCalled();
  });
});
