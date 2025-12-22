import React from 'react';
import { 
  FaRuler, 
  FaMoneyBillWave, 
  FaFilter, 
  FaSortAmountDown, 
  FaSortAmountUp,
  FaChevronRight,
  FaChevronLeft 
} from 'react-icons/fa';
import { ListViewSidebarProps, SortOption } from '../types/gasStationTypes';
import ClickableStats from './ClickableStats';

const ListViewSidebar: React.FC<ListViewSidebarProps> = ({
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
  isSidebarCollapsed = false,
  isDarkMode = false,
  viewMode = 'list',
    radius, // Add radius prop
  onRadiusChange, // Add onRadiusChange prop
}) => {
  return (
    <aside className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
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
          <h2>Filters & Sorting</h2>
        </div>
        <div className="station-count">
          <span className="count-number">{sortedStationsLength}</span>
          <span className="count-label">stations</span>
        </div>
      </div>

      <div className="quick-filters">
        <div className="filter-group">
          <label className="filter-label">Sort by:</label>
          <div className="sort-options">
            {['distance', 'price_diesel', 'price_e5', 'price_e10'].map((option) => (
              <button
                key={option}
                className={`sort-option ${sortBy === option ? 'active' : ''}`}
                onClick={() => setSortBy(option as SortOption)}
              >
                {option === 'distance' && <FaRuler />}
                {option.startsWith('price_') && <FaMoneyBillWave />}
                <span>{option.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Filters:</label>
          <div className="filter-options">
            <button 
              className={`filter-toggle ${showOnlyOpen ? 'active' : ''}`}
              onClick={() => setShowOnlyOpen(!showOnlyOpen)}
            >
              <FaFilter />
              <span>Open Now ({openStationsCount})</span>
            </button>
            
            <div className="price-filter">
              <span className="filter-label">Fuel Type:</span>
              <div className="price-buttons">
                {['all', 'diesel', 'e5', 'e10'].map((type) => (
                  <button
                    key={type}
                    className={`price-btn ${priceFilter === type ? 'active' : ''}`}
                    onClick={() => setPriceFilter(type as any)}
                  >
                    {type === 'all' ? 'All' : type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sort-direction">
          <button 
            className={`direction-btn ${sortDirection === 'low_to_high' ? 'active' : ''}`}
            onClick={() => setSortDirection('low_to_high')}
          >
            <FaSortAmountDown />
            <span>Low to High</span>
          </button>
          <button 
            className={`direction-btn ${sortDirection === 'high_to_low' ? 'active' : ''}`}
            onClick={() => setSortDirection('high_to_low')}
          >
            <FaSortAmountUp />
            <span>High to Low</span>
          </button>
        </div>
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

export default ListViewSidebar;