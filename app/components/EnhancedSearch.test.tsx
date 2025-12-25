import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedSearch from './EnhancedSearch';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaSearch: () => <div data-testid="search-icon">Search</div>,
  FaTimes: () => <div data-testid="times-icon">Times</div>,
  FaLocationArrow: () => <div data-testid="location-icon">Location</div>,
  FaMapMarkerAlt: () => <div data-testid="map-marker-icon">Map Marker</div>,
}));

describe('EnhancedSearch', () => {
  const mockOnLocationFound = jest.fn();
  const mockCurrentLocation = { lat: 52.52, lng: 13.405 };

  const defaultProps = {
    onLocationFound: mockOnLocationFound,
    currentLocation: mockCurrentLocation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders search input and buttons', () => {
    render(<EnhancedSearch {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search location, address, or zip code...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByTitle('Use current location')).toBeInTheDocument();
  });

  test('updates query on input change', () => {
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search location, address, or zip code...');
    fireEvent.change(input, { target: { value: 'Berlin' } });
    
    expect(input).toHaveValue('Berlin');
  });

  test('shows clear button when query is not empty', () => {
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search location, address, or zip code...');
    fireEvent.change(input, { target: { value: 'Berlin' } });
    
    expect(screen.getByTestId('times-icon')).toBeInTheDocument();
  });

  test('clears query when clear button is clicked', () => {
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search location, address, or zip code...');
    fireEvent.change(input, { target: { value: 'Berlin' } });
    
    const clearButton = screen.getByTestId('times-icon').closest('button')!;
    fireEvent.click(clearButton);
    
    expect(input).toHaveValue('');
    expect(screen.queryByTestId('times-icon')).not.toBeInTheDocument();
  });

  test('calls onLocationFound with current location when current location button is clicked', () => {
    render(<EnhancedSearch {...defaultProps} />);
    
    const locationButton = screen.getByTitle('Use current location');
    fireEvent.click(locationButton);
    
    expect(mockOnLocationFound).toHaveBeenCalledWith({
      lat: 52.52,
      lng: 13.405,
      name: 'Current Location',
    });
  });

  test('submits search form and calls onLocationFound', async () => {
    const mockResults = [
      {
        lat: '52.5200',
        lon: '13.4050',
        display_name: 'Berlin, Germany',
      },
    ];
    
    mockedAxios.get.mockResolvedValueOnce({ data: mockResults });
    
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search location, address, or zip code...');
    fireEvent.change(input, { target: { value: 'Berlin' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search?format=json&q=Berlin&countrycodes=de&limit=5'
      );
    });
    
    await waitFor(() => {
      expect(mockOnLocationFound).toHaveBeenCalledWith({
        lat: 52.52,
        lng: 13.405,
        name: 'Berlin, Germany',
      });
    });
  });

  test('shows suggestions when typing more than 2 characters', async () => {
    const mockResults = [
      {
        lat: '52.5200',
        lon: '13.4050',
        display_name: 'Berlin, Germany',
      },
      {
        lat: '52.5300',
        lon: '13.4100',
        display_name: 'Berlin Mitte, Berlin, Germany',
      },
    ];
    
    mockedAxios.get.mockResolvedValueOnce({ data: mockResults });
    
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search location, address, or zip code...');
    fireEvent.change(input, { target: { value: 'Ber' } });
    
    await waitFor(() => {
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Germany')).toBeInTheDocument();
    });
  });

  test('selects suggestion and calls onLocationFound', async () => {
    const mockResults = [
      {
        lat: '52.5200',
        lon: '13.4050',
        display_name: 'Berlin, Germany',
      },
    ];
    
    mockedAxios.get.mockResolvedValueOnce({ data: mockResults });
    
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search location, address, or zip code...');
    fireEvent.change(input, { target: { value: 'Ber' } });
    
    await waitFor(() => {
      const suggestion = screen.getByText('Berlin');
      fireEvent.click(suggestion.closest('.suggestion-item')!);
    });
    
    expect(mockOnLocationFound).toHaveBeenCalledWith({
      lat: 52.52,
      lng: 13.405,
      name: 'Berlin, Germany',
    });
    expect(input).toHaveValue('Berlin, Germany');
  });

  test('shows recent searches when available and no query', () => {
    const recentSearches = [
      { lat: 52.52, lng: 13.405, name: 'Berlin, Germany', query: 'Berlin' },
      { lat: 48.1351, lng: 11.5820, name: 'Munich, Germany', query: 'Munich' },
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(recentSearches));
    
    render(<EnhancedSearch {...defaultProps} />);
    
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Munich')).toBeInTheDocument();
  });

  test('calls onLocationFound with recent search when clicked', () => {
    const recentSearches = [
      { lat: 52.52, lng: 13.405, name: 'Berlin, Germany', query: 'Berlin' },
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(recentSearches));
    
    render(<EnhancedSearch {...defaultProps} />);
    
    const recentItem = screen.getByText('Berlin');
    fireEvent.click(recentItem.closest('button')!);
    
    expect(mockOnLocationFound).toHaveBeenCalledWith({
      lat: 52.52,
      lng: 13.405,
      name: 'Berlin, Germany',
    });
  });

  test('disables search button when query is empty', () => {
    render(<EnhancedSearch {...defaultProps} />);
    
    const searchButton = screen.getByRole('button', { name: 'Search' });
    expect(searchButton).toBeDisabled();
  });

  test('disables search button when searching', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search location, address, or zip code...');
    fireEvent.change(input, { target: { value: 'Berlin' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);
    
    const searchButton = screen.getByRole('button', { name: '...' });
    expect(searchButton).toBeDisabled();
  });

  test('handles search error gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search location, address, or zip code...');
    fireEvent.change(input, { target: { value: 'Berlin' } });
    
    const form = input.closest('form')!;
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });
    // Should not crash, just log error
  });
});