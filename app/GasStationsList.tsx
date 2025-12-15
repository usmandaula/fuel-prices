"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { GasStationsListProps } from './types/gasStationTypes';
import { calculateDistance } from './utils/distanceCalculator';
import Navbar from './components/layouts/Navbar';
import Footer from './components/layouts/Footer';
import MapViewLayout from './components/layouts/MapViewLayout';
import ListViewLayout from './components/layouts/ListViewLayout';
import { useDataProcessing } from './hooks/useDataProcessing';
import { useLocation } from './hooks/useLocation';
import { useDarkMode } from './hooks/useDarkMode';
const GasStationsList: React.FC<GasStationsListProps> = ({ 
  data, 
  initialUserLocation,
  onLocationSearch, 
  radius,
  onRadiusChange 
}) => {
  // STATE DECLARATIONS - must come before any hook that uses them
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [isLocating, setIsLocating] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  // Use custom hooks
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
    setIsSidebarCollapsed(!isSidebarCollapsed);
  }, [isSidebarCollapsed]);


  // Validate data
  if (!data.ok || data.status !== 'ok' || !Array.isArray(data.stations)) {
    return (
      <div className="error-container">
        <div className="error-content">
          <FaInfoCircle className="error-icon" />
          <h2>Unable to Load Data</h2>
          <p>Please check your connection and try again.</p>
          <button className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

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
            sortedStations={sortedStations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            userLocation={userLocation}
            searchedLocation={searchedLocation}
            sortBy={sortBy}
            sortDirection={sortDirection}
            setSortBy={setSortBy}
            setSortDirection={setSortDirection}
            showOnlyOpen={showOnlyOpen}
            setShowOnlyOpen={setShowOnlyOpen}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            openStationsCount={openStationsCount}
            averagePrice={averagePrice}
            bestPrices={bestPrices}
            handleBestPriceClick={handleBestPriceClick}
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            isDarkMode={isDarkMode}
            mapLayer={mapLayer}
            showTraffic={showTraffic}
            setMapLayer={setMapLayer}
            setShowTraffic={setShowTraffic}
            getUserLocation={getUserLocation}
            mapZoom={mapZoom}
            setMapZoom={setMapZoom}
            getDirections={getDirections}
            radius={radius}
            onRadiusChange={onRadiusChange}
          />
        ) : (
          <ListViewLayout
            sortedStations={sortedStations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            sortBy={sortBy}
            sortDirection={sortDirection}
            setSortBy={setSortBy}
            setSortDirection={setSortDirection}
            showOnlyOpen={showOnlyOpen}
            setShowOnlyOpen={setShowOnlyOpen}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            openStationsCount={openStationsCount}
            averagePrice={averagePrice}
            bestPrices={bestPrices}
            handleBestPriceClick={handleBestPriceClick}
            isSidebarCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            isDarkMode={isDarkMode}
            isLocating={isLocating}
            getUserLocation={getUserLocation}
            scrollToStation={scrollToStation}
            radius={radius}
            onRadiusChange={onRadiusChange}
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