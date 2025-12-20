// App.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './page';
import * as gasStationService from './services/gasStationService';

// Mock GasStationsList – we add props that help us assert behavior
jest.mock('./GasStationsList', () => {
  return function MockGasStationsList(props: any) {
    return (
      <div data-testid="gas-stations-list">
        {/* Expose current location and radius for assertions */}
        <div data-testid="current-location">{props.initialUserLocation?.name}</div>
        <div data-testid="current-radius">{props.radius}</div>

        {/* Button to trigger location search */}
        <button
          data-testid="search-location-btn"
          onClick={() =>
            props.onLocationSearch({
              lat: 48.8566,
              lng: 2.3522,
              name: 'Paris, France',
            })
          }
        >
          Search Paris
        </button>

        {/* Radius selector */}
        <select
          data-testid="radius-select"
          value={props.radius}
          onChange={(e) => props.onRadiusChange(Number(e.target.value))}
        >
          {[1, 3, 5, 10, 15, 25].map((r) => (
            <option key={r} value={r}>
              {r} km
            </option>
          ))}
        </select>
      </div>
    );
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(() => {
    mockLocalStorage.getItem.mockReturnValue(null);
  }),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('App Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('shows loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/Loading Gas Stations/i)).toBeInTheDocument();
    expect(screen.getByText(/Fetching the latest fuel prices/i)).toBeInTheDocument();
  });

  it('uses geolocation on mount when supported', async () => {
    const mockData = { stations: [], ok: true };
    jest.spyOn(gasStationService, 'fetchGasStationsCached').mockResolvedValue(mockData);

    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: 50.1109, longitude: 8.6821 } } as Position)
    );

    render(<App />);

    await waitFor(() => expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled());

    await waitFor(() => expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument());

    expect(screen.getByTestId('current-location')).toHaveTextContent('Your Current Location');
  });

  it('falls back to default location (Berlin) if geolocation fails', async () => {
    const mockData = { stations: [], ok: true };
    jest.spyOn(gasStationService, 'fetchGasStationsCached').mockResolvedValue(mockData);

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) =>
      error({ code: 1 } as PositionError)
    );

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument());

    expect(screen.getByTestId('current-location')).toHaveTextContent('Berlin, Germany');
  });

  it('loads saved search from localStorage on mount', async () => {
    const savedSearch = {
      lat: 48.8566,
      lng: 2.3522,
      name: 'Paris, France',
      radius: 10,
      timestamp: Date.now(),
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSearch));

    const mockData = { stations: [], ok: true };
    jest.spyOn(gasStationService, 'fetchGasStationsCached').mockResolvedValue(mockData);

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument());

    expect(screen.getByTestId('current-location')).toHaveTextContent('Paris, France');
    expect(screen.getByTestId('current-radius')).toHaveTextContent('10');
  });

  it('handles location search from child component', async () => {
    const mockData = { stations: [], ok: true };
    jest.spyOn(gasStationService, 'fetchGasStationsCached')
      .mockResolvedValueOnce(mockData) // initial load
      .mockResolvedValueOnce(mockData); // after search

    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: 52.52, longitude: 13.405 } } as Position)
    );

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument());

    await user.click(screen.getByTestId('search-location-btn'));

    await waitFor(() =>
      expect(screen.getByTestId('current-location')).toHaveTextContent('Paris, France')
    );

    expect(gasStationService.fetchGasStationsCached).toHaveBeenLastCalledWith(
      48.8566,
      2.3522,
      expect.any(Number) // radius may be default or previous
    );
  });

  it('handles radius change and refetches data', async () => {
    const mockData = { stations: [], ok: true };
    jest.spyOn(gasStationService, 'fetchGasStationsCached')
      .mockResolvedValueOnce(mockData) // initial
      .mockResolvedValueOnce(mockData); // after radius change

    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: 52.52, longitude: 13.405 } } as Position)
    );

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument());

    await user.selectOptions(screen.getByTestId('radius-select'), '15');

    await waitFor(() =>
      expect(gasStationService.fetchGasStationsCached).toHaveBeenLastCalledWith(
        expect.any(Number),
        expect.any(Number),
        15
      )
    );

    expect(screen.getByTestId('current-radius')).toHaveTextContent('15');
  });

  it('displays error state when fetch fails and no cache exists', async () => {
    jest.spyOn(gasStationService, 'fetchGasStationsCached').mockRejectedValue(
      new Error('Network error')
    );

    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: 50, longitude: 8 } } as Position)
    );

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Unable to Load Data/i)).toBeInTheDocument());

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try with Current Location/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Use Berlin, Germany/i })).toBeInTheDocument();
  });

  it('saves last search to localStorage after successful fetch', async () => {
    const mockData = { stations: [], ok: true };
    jest.spyOn(gasStationService, 'fetchGasStationsCached').mockResolvedValue(mockData);

    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: 40.7128, longitude: -74.006 } } as Position)
    );

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument());

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'lastGasStationSearch',
      expect.stringContaining('"name":"Your Current Location"')
    );
  });

  it('shows app title and beta badge', async () => {
    const mockData = { stations: [], ok: true };
    jest.spyOn(gasStationService, 'fetchGasStationsCached').mockResolvedValue(mockData);

    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: 52.52, longitude: 13.4 } } as Position)
    );

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument());

    expect(screen.getByText('FuelFinder')).toBeInTheDocument();
    expect(screen.getByText('BETA')).toBeInTheDocument();
  });
});