import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface RecentSearch {
  lat: number;
  lng: number;
  name: string;
  query: string;
}

interface RecentSearchesProps {
  recentSearches: RecentSearch[];
  onSelect: (search: RecentSearch) => void;
  onSearchClick: (query: string) => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ 
  recentSearches, 
  onSelect, 
  onSearchClick 
}) => {
  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div className="recent-searches">
      <div className="recent-header">Recent Searches</div>
      <div className="recent-items">
        {recentSearches.map((search, index) => (
          <button
            key={index}
            className="recent-item"
            onClick={() => {
              onSelect(search);
              onSearchClick(search.query);
            }}
          >
            <FaSearch className="recent-icon" />
            <span>{search.query}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;