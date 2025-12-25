import React from 'react';
import dynamic from 'next/dynamic';
import MapViewSidebar from '../MapViewSidebar';
import MapControls from '../MapControls';
import SelectedStationOverlay from '../ui/SelectedStationOverlay';
import MapLegend from '../ui/MapLegend';
import { 
  GasStation, 
  SortOption, 
  SortDirection, 
  MapLayer,
  FuelType,
  BestPriceInfo 
} from '../types/gasStationTypes';

const DetailedMapView = dynamic(() => import('../../DetailedMapView'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="map-spinner"></div>
      <p>Loading detailed map...</p>
    </div>
  )
});

interface MapViewLayoutProps {
  sortedStations: GasStation[];
  selectedStation: GasStation | null;
  setSelectedStation: (station: GasStation | null) => void;
  userLocation: { lat: number; lng: number; name?: string } | undefined;
  searchedLocation: { lat: number; lng: number; name: string } | null;
  sortBy: SortOption;
  sortDirection: SortDirection;
  setSortBy: (option: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  setPriceFilter: (filter: 'all' | 'diesel' | 'e5' | 'e10') => void;
  openStationsCount: number;
  averagePrice: string;
  bestPrices: {
    diesel: BestPriceInfo | null;
    e5: BestPriceInfo | null;
    e10: BestPriceInfo | null;
    overall: BestPriceInfo | null;
  };
  handleBestPriceClick: (stationId: string, fuelType?: FuelType) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isDarkMode: boolean;
  mapLayer: MapLayer;
  showTraffic: boolean;
  setMapLayer: (layer: MapLayer) => void;
  setShowTraffic: (show: boolean) => void;
  getUserLocation: () => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;
  getDirections: (station: GasStation) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

const MapViewLayout: React.FC<MapViewLayoutProps> = ({
  sortedStations,
  selectedStation,
  setSelectedStation,
  userLocation,
  searchedLocation,
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
  mapLayer,
  showTraffic,
  setMapLayer,
  setShowTraffic,
  getUserLocation,
  mapZoom,
  setMapZoom,
  getDirections,
  radius,
  onRadiusChange
}) => {
  return (
    <>
      <MapViewSidebar
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
        viewMode="map"
        radius={radius}
        onRadiusChange={onRadiusChange}
      />

      <div className="app-map-area">
        <div className="map-container">
          <DetailedMapView
            stations={sortedStations}
            selectedStation={selectedStation}
            userLocation={userLocation}
            onStationSelect={setSelectedStation}
            searchedLocation={searchedLocation}
            mapLayer={mapLayer}
            showTraffic={showTraffic}
            onZoomChange={setMapZoom}
          />
          
          <MapControls
            onLayerChange={setMapLayer}
            onToggleTraffic={() => setShowTraffic(!showTraffic)}
            onRecenter={getUserLocation}
            activeLayer={mapLayer}
            showTraffic={showTraffic}
          />

          <div className="zoom-indicator">
            <div className="zoom-level">Zoom: {mapZoom}x</div>
          </div>

          {/* {selectedStation && (
            <SelectedStationOverlay
              station={selectedStation}
              priceFilter={priceFilter}
              onClose={() => setSelectedStation(null)}
              onGetDirections={() => getDirections(selectedStation)}
            />
          )} */}
        </div>

        <MapLegend />
      </div>
    </>
  );
};

export default MapViewLayout;