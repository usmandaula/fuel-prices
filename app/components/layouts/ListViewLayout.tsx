import React from 'react';
import { FaLocationArrow, FaFilter, FaChevronRight } from 'react-icons/fa';
import ListViewSidebar from '../ListViewSidebar';
import StationCard from '../StationCard';
import RadiusSelector from '../ui/RadiusSelector';
import EmptyState from '../ui/EmptyState';
import { 
  GasStation, 
  SortOption, 
  SortDirection,
  FuelType,
  BestPriceInfo,
  ListViewLayoutProps
} from '../../types/gasStationTypes';



const ListViewLayout: React.FC<ListViewLayoutProps> = ({
  sortedStations,
  selectedStation,
  setSelectedStation,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
  showOnlyOpen,
  setShowOnlyOpen,
  priceFilter,
  setPriceFilter,
  openStationsCount,
  averagePrice,
  bestPrices,
  handleBestPriceClick,
  isSidebarCollapsed,
  toggleSidebar,
  isDarkMode,
  isLocating,
  getUserLocation,
  scrollToStation,
  radius,
  onRadiusChange,
  userLocation
}) => {
  return (
    <>
      <ListViewSidebar
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        showOnlyOpen={showOnlyOpen}
        setShowOnlyOpen={setShowOnlyOpen}
        priceFilter={priceFilter}
        setPriceFilter={setPriceFilter}
        openStationsCount={openStationsCount}
        sortedStationsLength={sortedStations.length}
        averagePrice={averagePrice}
        bestPrices={bestPrices}
        selectedFuelType={priceFilter}
        onPriceClick={handleBestPriceClick}
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        isDarkMode={isDarkMode}
        viewMode="list"
        radius={radius}
        onRadiusChange={onRadiusChange}
      />

      <div className="list-view-container">
        <div className="list-view-header">
          <div className="list-view-title">
            {isSidebarCollapsed && (
              <button className="sidebar-toggle-btn-inline" onClick={toggleSidebar}>
                <FaChevronRight />
                <span>Show Filters</span>
              </button>
            )}
            <h2>Gas Stations</h2>
            <div className="list-stats">
              <span><b>Total Stations • {sortedStations.length}  </b></span>
              <span><b>Open • {openStationsCount}  </b></span>
              <span><b>Sorted by {sortBy.replace('_', ' ')} ({sortDirection === 'low_to_high' ? 'Low to High' : 'High to Low'})</b></span>
            </div>
          </div>
          
          <div className="list-view-actions">
            <button 
              className="list-action-btn"
              onClick={getUserLocation}
              disabled={isLocating}
            >
              <FaLocationArrow />
              <span>{isLocating ? 'Updating...' : 'Refresh Location'}</span>
            </button>
            <button 
              className="list-action-btn"
              onClick={() => setShowOnlyOpen(!showOnlyOpen)}
            >
              <FaFilter />
              <span>{showOnlyOpen ? 'Show All' : 'Show Open Only'}</span>
            </button>
            
            <RadiusSelector
              radius={radius}
              onRadiusChange={onRadiusChange}
              className="radius-selector-list"
            />
          </div>
        </div>

        <div className="list-view-content">
          <div className="stations-grid-container">
            {sortedStations.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="stations-grid">
                {sortedStations.map((station) => (
                  <div key={station.id} className="station-grid-item">
                    <StationCard
                      station={station}
                      isSelected={selectedStation?.id === station.id}
                      onSelect={setSelectedStation}
                      sortBy={sortBy}
                      isBestForSelectedFuel={station.isBestForSelectedFuel || false}
                      isOverallBestPrice={station.isOverallBestPrice || false}
                      selectedFuelType={priceFilter}
                      scrollToStation={scrollToStation}
                      userLocation={userLocation}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ListViewLayout;