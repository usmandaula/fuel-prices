import React from 'react';
import { FaFilter, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { MapViewSidebarProps } from '../types/gasStationTypes';
import ClickableStats from './ClickableStats';
import RadiusSelector from './ui/RadiusSelector';

// Define radius options (same as in main app)
const RADIUS_OPTIONS = [1, 3, 5, 10, 15, 25] as const;

const MapViewSidebar: React.FC<MapViewSidebarProps> = ({
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  showOnlyOpen,
  setShowOnlyOpen,
  priceFilter,
  setPriceFilter,
  openStationsCount,
  sortedStationsLength,
  averagePrice,
  bestPrices,
  selectedFuelType,
  onPriceClick,
  onToggleSidebar,
  radius, // Add radius prop
  onRadiusChange, // Add onRadiusChange prop
  isSidebarCollapsed = false,
  isDarkMode = false,
  viewMode = 'map'
}) => {
  return (
    <aside className={`app-sidebar map-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          {onToggleSidebar && (
            <button 
    className="sidebar-toggle-btn" 
    onClick={onToggleSidebar}
    aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
  >
    {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
  </button>
          )}
          <h2>Map View</h2>
        </div>
        <div className="station-count">
          <span className="count-number">{sortedStationsLength}</span>
          <span className="count-label">stations visible</span>
        </div>
      </div>

      {/* Add Radius Selector Section */}
      

      <div className="quick-filters">
        <div className="filter-group">
          <label className="filter-label">Quick Filters:</label>
          <div className="filter-options">
            <button 
              className={`filter-toggle ${showOnlyOpen ? 'active' : ''}`}
              onClick={() => setShowOnlyOpen(!showOnlyOpen)}
            >
              <FaFilter />
              <span>{showOnlyOpen ? 'Show All' : 'Open Now'} ({openStationsCount})</span>
            </button>
          </div>
        </div>
        <RadiusSelector radius={radius} onRadiusChange={onRadiusChange} />
{/* <div className="radius-selector-sidebar">
        <label className="filter-label">Search Radius:</label>
        <div className="radius-buttons-sidebar">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              className={`radius-btn-sidebar ${radius === r ? 'active' : ''}`}
              onClick={() => onRadiusChange && onRadiusChange(r)}
              title={`Search within ${r}km`}
            >
              {r}km
            </button>
          ))}
        </div>
        {radius && (
          <div className="current-radius-display">
            <span>Current: 
              <b>{radius}km</b></span>
          </div>
        )}
      </div> */}
        {/* <div className="filter-group">
          <label className="filter-label">Fuel Price Focus:</label>
          <div className="price-buttons-simple">
            {['all', 'diesel', 'e5', 'e10'].map((type) => (
              <button
                key={type}
                className={`price-btn-simple ${priceFilter === type ? 'active' : ''}`}
                onClick={() => setPriceFilter(type as any)}
              >
                {type === 'all' ? 'All Fuels' : type.toUpperCase()}
              </button>
            ))}
          </div>
        </div> */}
      </div>

      <div className="sidebar-footer">
        <ClickableStats
          bestPrices={bestPrices}
          onPriceClick={onPriceClick}
          openStationsCount={openStationsCount}
          sortedStationsLength={sortedStationsLength}
          averagePrice={averagePrice}
          selectedFuelType={selectedFuelType}
          isMapView={viewMode === 'map'}
        />
      </div>
    </aside>
  );
};

export default MapViewSidebar;