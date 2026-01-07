import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaLocationArrow, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import RecentSearches from './RecentSearches';

interface EnhancedSearchProps {
  onLocationFound: (location: { lat: number; lng: number; name: string }) => void;
  currentLocation?: { lat: number; lng: number };
}

interface RecentSearch {
  lat: number;
  lng: number;
  name: string;
  query: string;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({ onLocationFound, currentLocation }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('gasRecentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  const saveRecentSearch = (location: { lat: number; lng: number; name: string }, searchQuery: string) => {
    const newSearch: RecentSearch = {
      ...location,
      query: searchQuery
    };

    const updatedRecent = [
      newSearch,
      ...recentSearches.filter(s => s.query !== searchQuery)
    ].slice(0, 5);
    
    setRecentSearches(updatedRecent);
    localStorage.setItem('gasRecentSearches', JSON.stringify(updatedRecent));
  };

  const searchLocation = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=de&limit=5`
      );
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const results = await searchLocation(query);
    if (results.length > 0) {
      const firstResult = results[0];
      const location = {
        lat: parseFloat(firstResult.lat),
        lng: parseFloat(firstResult.lon),
        name: firstResult.display_name
      };
      onLocationFound(location);
      saveRecentSearch(location, query);
    }
  };

  const handleInputChange = async (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      const results = await searchLocation(value);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    const location = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name
    };
    onLocationFound(location);
    saveRecentSearch(location, item.display_name);
    setQuery(item.display_name);
    setShowSuggestions(false);
  };

  const handleRecentSearchSelect = (search: RecentSearch) => {
    onLocationFound(search);
    saveRecentSearch(search, search.query);
  };

  return (
    <div className="enhanced-search">
      <form onSubmit={handleSearch} className="search-bar">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search location, address, or zip code..."
            className="search-input"
          />
          {query && (
            <button 
              type="button" 
              className="clear-search"
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
              }}
            >
              <FaTimes />
            </button>
          )}
          <button 
            type="submit" 
            className="search-submit"
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>
        
        <button 
          type="button"
          className="current-location-btn"
          onClick={() => currentLocation && onLocationFound({...currentLocation, name: 'Current Location'})}
          title="Use current location"
        >
          <FaLocationArrow />
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((item, index) => (
            <div 
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(item)}
            >
              <FaMapMarkerAlt className="suggestion-icon" />
              <div className="suggestion-content">
                <div className="suggestion-title">{item.display_name.split(',')[0]}</div>
                <div className="suggestion-subtitle">{item.display_name.split(',').slice(1).join(',').trim()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* {!showSuggestions && query.length === 0 && (
        <RecentSearches
          recentSearches={recentSearches}
          onSelect={handleRecentSearchSelect}
          onSearchClick={setQuery}
        />
      )} */}
    </div>
  );
};

export default EnhancedSearch;