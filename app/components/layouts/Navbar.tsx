import React from 'react';
import { FaList, FaMap } from 'react-icons/fa';
import EnhancedSearch from '../EnhancedSearch';
import DarkModeToggle from '../DarkModeToggle';

interface NavbarProps {
  onLocationFound: (location: { lat: number; lng: number; name: string }) => void;
  currentLocation?: { lat: number; lng: number; name?: string };
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  onLocationFound,
  currentLocation,
  viewMode,
  setViewMode,
  isDarkMode,
  toggleDarkMode
}) => {
  return (
    <nav className="app-nav">
      <div className="nav-left"></div>
      
      <div className="nav-center">
        <EnhancedSearch 
          onLocationFound={onLocationFound}
          currentLocation={currentLocation}
        />
      </div>
      
      <div className="nav-right">
        <div className="nav-actions">
          <DarkModeToggle 
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <div className="view-switch">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList />
              <span>List</span>
            </button>
            <button 
              className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <FaMap />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;