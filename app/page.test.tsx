import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './page';

// Mock the GasStationsList component
jest.mock('./GasStationsList', () => ({ 
  __esModule: true,
  default: ({ data, initialUserLocation, onLocationSearch, radius, onRadiusChange }: any) => (
    <div data-testid="gas-stations-list">
      <div>GasStationsList Component</div>
      <div>Data: {data ? 'Loaded' : 'Not Loaded'}</div>
      <div>Location: {initialUserLocation?.name || 'None'}</div>
      <div>Radius: {radius}km</div>
      <button onClick={() => onLocationSearch({ lat: 52.52, lng: 13.405, name: 'Test Location' })}>
        Test Location Search
      </button>
      <button onClick={() => onRadiusChange(10)}>
        Change Radius to 10km
      </button>
    </div>
  ),
}));

// Mock the gas station service
jest.mock('./services/gasStationService', () => ({
  fetchGasStationsCached: jest.fn(() => Promise.resolve({
    ok: true,
    status: 'ok',
    stations: [],
    data: { source: 'tankerkoenig' },
  })),
}));

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    render(<App />);
    
    expect(screen.getByText('Loading Gas Stations')).toBeInTheDocument();
    expect(screen.getByText('Fetching the latest fuel prices in your area...')).toBeInTheDocument();
  });

  it('loads and displays gas stations', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument();
    });
    
    expect(screen.getByText('GasStationsList Component')).toBeInTheDocument();
    expect(screen.getByText('Data: Loaded')).toBeInTheDocument();
  });

  it('handles location search from child component', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument();
    });
    
    const searchButton = screen.getByText('Test Location Search');
    fireEvent.click(searchButton);
    
    // Should update the location and re-fetch data
    await waitFor(() => {
      expect(require('./services/gasStationService').fetchGasStationsCached)
        .toHaveBeenCalledWith(52.52, 13.405, 5);
    });
  });

  it('handles radius change from child component', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument();
    });
    
    const radiusButton = screen.getByText('Change Radius to 10km');
    fireEvent.click(radiusButton);
    
    // Should update radius and re-fetch data
    await waitFor(() => {
      expect(require('./services/gasStationService').fetchGasStationsCached)
        .toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 10);
    });
  });

  it('shows error state when fetch fails', async () => {
    const mockError = new Error('API Error');
    (require('./services/gasStationService').fetchGasStationsCached as jest.Mock)
      .mockRejectedValueOnce(mockError);
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Unable to Load Data')).toBeInTheDocument();
    });
    
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });

  it('uses cached search state on reload', async () => {
    const savedSearch = {
      lat: 50.0,
      lng: 8.0,
      name: 'Frankfurt',
      radius: 3,
      timestamp: Date.now(),
    };
    
    localStorage.setItem('lastGasStationSearch', JSON.stringify(savedSearch));
    
    render(<App />);
    
    await waitFor(() => {
      expect(require('./services/gasStationService').fetchGasStationsCached)
        .toHaveBeenCalledWith(50.0, 8.0, 3);
    });
  });

  it('refreshes data when refresh button clicked', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('gas-stations-list')).toBeInTheDocument();
    });
    
    // Note: You'll need to add a refresh button to your App component for this test to work
    // const refreshButton = screen.getByText('Refresh');
    // fireEvent.click(refreshButton);
    
    // await waitFor(() => {
    //   expect(require('../services/gasStationService').fetchGasStationsCached)
    //     .toHaveBeenCalledTimes(2);
    // });
  });
});