"use client";
import React, { useState, useCallback,useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { GasStationsListProps } from './types/gasStationTypes';
import Navbar from './components/layouts/Navbar';
import Footer from './components/layouts/Footer';
import MapViewLayout from './components/layouts/MapViewLayout';
import ListViewLayout from './components/layouts/ListViewLayout';
import { useDataProcessing } from './hooks/useDataProcessing';
import { useLocation } from './hooks/useLocation';
import { useDarkMode } from './hooks/useDarkMode';
import { usePersistentState } from './hooks/usePersistentState';

const GasStationsList: React.FC<GasStationsListProps> = ({ 
  data, 
  initialUserLocation,
  onLocationSearch, 
  radius,
  onRadiusChange 
}) => {
  // STATE DECLARATIONS

 //const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

   const [viewMode, setViewMode] = usePersistentState<'list' | 'map'>(
     'fuelFinder_viewMode', 
     'map',
   
   );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // Custom hooks
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  const {
    userLocation,
    searchedLocation,
    handleLocationFound,
    getUserLocation
  } = useLocation(initialUserLocation, onLocationSearch, setIsLocating);

  const {
    sortedStations,
    selectedStation,
    setSelectedStation,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    showOnlyOpen,
    setShowOnlyOpen,
    priceFilter,
    setPriceFilter,
    openStationsCount,
    averagePrice,
    bestPrices,
    handleBestPriceClick,
    scrollToStation,
    mapLayer,
    setMapLayer,
    showTraffic,
    setShowTraffic,
    mapZoom,
    setMapZoom,
    getDirections
  } = useDataProcessing(data, userLocation, viewMode);

  // Toggle functions
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);
useEffect(() => {
  // Force a DOM update when viewMode changes
  console.log('🔄 ViewMode changed to:', viewMode);
}, [viewMode]);
  // Data validation - moved before hooks to prevent conditional hook calls
  if (!data || data.status !== 'ok' || !Array.isArray(data.stations)) {
    return (
      <div className={`error-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="error-content">
          <FaInfoCircle className="error-icon" size={48} />
          <h2>Unable to Load Data</h2>
          <p>Please check your connection and try again.</p>
          <button className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  // Common props for both view layouts
  const commonLayoutProps = {
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
    radius,
     onRadiusChange: (newRadius: number) => {
    console.log('📏 GasStationsList: onRadiusChange called', newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    } else {
      console.error('❌ onRadiusChange prop is undefined!');
    }
  }
  };
  

  return (
    <div className={`gas-stations-app-enhanced ${isDarkMode ? 'dark' : ''}`}>
      <Navbar
        onLocationFound={handleLocationFound}
        currentLocation={userLocation}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="app-main">
        {viewMode === 'map' ? (
          <MapViewLayout
            {...commonLayoutProps}
            userLocation={userLocation}
            searchedLocation={searchedLocation}
            mapLayer={mapLayer}
            showTraffic={showTraffic}
            setMapLayer={setMapLayer}
            setShowTraffic={setShowTraffic}
            getUserLocation={getUserLocation}
            mapZoom={mapZoom}
            setMapZoom={setMapZoom}
            getDirections={getDirections}
          />
        ) : (
          <ListViewLayout
            {...commonLayoutProps}
            isLocating={isLocating}
            getUserLocation={getUserLocation}
            scrollToStation={scrollToStation}
          />
        )}
      </main>

      <Footer
        userLocation={userLocation}
        isLocating={isLocating}
        dataSource={data.data}
        getUserLocation={getUserLocation}
        gasStationData={data}
      />
    </div>
  );
};

export default GasStationsList;