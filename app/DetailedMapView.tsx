"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle, 
  ZoomControl,
  LayersControl,
  ScaleControl,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icons
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
    iconUrl: '/leaflet/images/marker-icon.png',
    shadowUrl: '/leaflet/images/marker-shadow.png',
  });
}

interface GasStation {
  id: string;
  name: string;
  brand: string;
  street: string;
  place: string;
  lat: number;
  lng: number;
  dist: number;
  diesel: number;
  e5: number;
  e10: number;
  isOpen: boolean;
  houseNumber: string;
  postCode: number;
  rating?: number;
  amenities?: string[];
  isBestForSelectedFuel?: boolean;
  isOverallBestPrice?: boolean;
  minPrice?: number;
}

interface DetailedMapViewProps {
  stations: GasStation[];
  selectedStation?: GasStation | null;
  userLocation?: { lat: number; lng: number; name?: string };
  onStationSelect: (station: GasStation) => void;
  searchedLocation?: { lat: number; lng: number; name: string } | null;
  mapLayer: 'standard' | 'satellite' | 'terrain';
  showTraffic?: boolean;
  onZoomChange: (zoom: number) => void;
  priceFilter?: 'all' | 'diesel' | 'e5' | 'e10';
}

// Custom icons with brand colors and clickable states
const createStationIcon = (
  brand: string, 
  isOpen: boolean, 
  isSelected: boolean, 
  rating?: number,
  isBestForFuel?: boolean,
  isOverallBest?: boolean
) => {
  const brandColors: Record<string, string> = {
    'SHELL': '#FF0000',
    'TOTAL': '#0047AB',
    'ARAL': '#005BA9',
    'ESSO': '#FF0000',
    'AVIA': '#00A650',
    'HEM': '#FF6B00',
    'JET': '#231F20',
    'STAR': '#FFD700',
    'DEFAULT': '#6B7280'
  };

  const color = brandColors[brand] || brandColors.DEFAULT;
  const size = isSelected ? 56 : rating && rating > 4 ? 44 : 36;
  const borderColor = isSelected ? '#3B82F6' : 
                     isOverallBest ? '#FFD700' : 
                     isBestForFuel ? '#10B981' : 
                     isOpen ? '#10B981' : '#EF4444';
  const borderWidth = isSelected ? 4 : isOverallBest || isBestForFuel ? 3 : 2;
  const shadowSize = isSelected ? 10 : isOverallBest || isBestForFuel ? 6 : 4;
  
  // Add special badges
  const badges = [];
  if (isOverallBest) badges.push('👑');
  if (isBestForFuel) badges.push('🏆');
  if (rating && rating > 4.5) badges.push('⭐');

  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: linear-gradient(135deg, ${color} 0%, ${color}88 100%);
      border: ${borderWidth}px solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 ${shadowSize}px ${shadowSize * 2}px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size * 0.4}px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
    ">
      ⛽
      ${badges.length > 0 ? `
        <div style="
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: ${isOverallBest ? '#FFD700' : isBestForFuel ? '#10B981' : '#F59E0B'};
          color: ${isOverallBest ? '#000' : 'white'};
          min-width: 24px;
          height: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          border: 2px solid white;
          padding: 0 4px;
        ">
          ${badges.join('')}
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'station-marker clickable-marker',
    html: iconHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const createUserLocationIcon = (isCurrent: boolean = true) => {
  const color = isCurrent ? '#3B82F6' : '#10B981';
  const size = 48;
  
  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle, ${color} 30%, ${color}44 70%);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
    ">
      <div style="
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'user-marker clickable-marker',
    html: iconHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Price gradient circle for heatmap-like visualization
const PriceGradientCircle: React.FC<{ 
  station: GasStation;
  fuelType: 'diesel' | 'e5' | 'e10';
  isSelected: boolean;
}> = ({ station, fuelType, isSelected }) => {
  const price = station[fuelType];
  const radius = Math.max(30, Math.min(200, (2.0 - price) * 120)); // Adjust radius based on price
  
  let color = '#10B981'; // Green for cheap
  if (price > 1.5) color = '#EF4444'; // Red for expensive
  else if (price > 1.3) color = '#F59E0B'; // Orange for medium

  return (
    <Circle
      center={[station.lat, station.lng]}
      radius={radius}
      pathOptions={{
        fillColor: color,
        color: isSelected ? '#3B82F6' : color,
        fillOpacity: isSelected ? 0.2 : 0.1,
        weight: isSelected ? 3 : 1,
        opacity: isSelected ? 0.8 : 0.5,
        dashArray: isSelected ? '5, 5' : undefined
      }}
    />
  );
};

// Zoom tracker component
const ZoomTracker: React.FC<{ onZoomChange: (zoom: number) => void }> = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    }
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
};

// Cluster visualization component
const StationClusters: React.FC<{ 
  stations: GasStation[];
  onClusterClick: (stations: GasStation[]) => void;
  priceFilter?: 'all' | 'diesel' | 'e5' | 'e10';
}> = ({ stations, onClusterClick, priceFilter }) => {
  const map = useMap();
  
  useEffect(() => {
    const clusters = new Map<string, GasStation[]>();
    
    stations.forEach(station => {
      // Round coordinates to 3 decimal places for clustering
      const key = `${station.lat.toFixed(3)},${station.lng.toFixed(3)}`;
      if (!clusters.has(key)) {
        clusters.set(key, []);
      }
      clusters.get(key)?.push(station);
    });

    // Create cluster markers
    const clusterMarkers: L.Marker[] = [];
    clusters.forEach((clusterStations, key) => {
      if (clusterStations.length > 1) {
        const [lat, lng] = key.split(',').map(Number);
        
        // Calculate average price based on filter
        let avgPrice = 0;
        if (priceFilter === 'diesel') {
          avgPrice = clusterStations.reduce((sum, s) => sum + s.diesel, 0) / clusterStations.length;
        } else if (priceFilter === 'e5') {
          avgPrice = clusterStations.reduce((sum, s) => sum + s.e5, 0) / clusterStations.length;
        } else if (priceFilter === 'e10') {
          avgPrice = clusterStations.reduce((sum, s) => sum + s.e10, 0) / clusterStations.length;
        } else {
          avgPrice = clusterStations.reduce((sum, s) => sum + s.diesel + s.e5 + s.e10, 0) / (clusterStations.length * 3);
        }
        
        const clusterSize = Math.min(80, 40 + clusterStations.length * 6);
        const color = avgPrice > 1.5 ? '#EF4444' : avgPrice > 1.3 ? '#F59E0B' : '#10B981';
        
        const icon = L.divIcon({
          className: 'cluster-marker clickable-marker',
          html: `
            <div style="
              width: ${clusterSize}px;
              height: ${clusterSize}px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${clusterSize * 0.3}px;
              box-shadow: 0 6px 20px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              ${clusterStations.length}
            </div>
          `,
          iconSize: [clusterSize, clusterSize],
          iconAnchor: [clusterSize / 2, clusterSize / 2]
        });

        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .on('click', () => {
            onClusterClick(clusterStations);
            // Zoom to cluster
            map.setView([lat, lng], Math.max(map.getZoom() + 1, 15));
          })
          .bindPopup(`
            <div class="cluster-popup">
              <h4>${clusterStations.length} Stations</h4>
              <div>Average Price: €${avgPrice.toFixed(3)}</div>
              <div>Click to zoom in</div>
            </div>
          `);
        
        clusterMarkers.push(marker);
      }
    });

    return () => {
      clusterMarkers.forEach(marker => map.removeLayer(marker));
    };
  }, [stations, map, onClusterClick, priceFilter]);

  return null;
};

// Custom control for map
const CustomControls: React.FC<{
  showPriceCircles: boolean;
  setShowPriceCircles: (show: boolean) => void;
  priceCircleType: 'diesel' | 'e5' | 'e10';
  setPriceCircleType: (type: 'diesel' | 'e5' | 'e10') => void;
  showClusters: boolean;
  setShowClusters: (show: boolean) => void;
  onRecenter: () => void;
  onShowAllStations: () => void;
  onShowCheapest: () => void;
  priceFilter?: 'all' | 'diesel' | 'e5' | 'e10';
}> = ({ 
  showPriceCircles, 
  setShowPriceCircles, 
  priceCircleType, 
  setPriceCircleType,
  showClusters,
  setShowClusters,
  onRecenter,
  onShowAllStations,
  onShowCheapest,
  priceFilter
}) => {
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar custom-controls">
        <div className="control-group">
          <button 
            className={`control-btn ${showPriceCircles ? 'active' : ''}`}
            onClick={() => setShowPriceCircles(!showPriceCircles)}
            title="Price Visualization"
          >
            💵
          </button>
          {showPriceCircles && (
            <div className="control-dropdown">
              <button 
                className={`dropdown-btn ${priceCircleType === 'diesel' ? 'active' : ''}`}
                onClick={() => setPriceCircleType('diesel')}
              >
                Diesel
              </button>
              <button 
                className={`dropdown-btn ${priceCircleType === 'e5' ? 'active' : ''}`}
                onClick={() => setPriceCircleType('e5')}
              >
                E5
              </button>
              <button 
                className={`dropdown-btn ${priceCircleType === 'e10' ? 'active' : ''}`}
                onClick={() => setPriceCircleType('e10')}
              >
                E10
              </button>
            </div>
          )}
        </div>
        
        <div className="control-group">
          <button 
            className={`control-btn ${showClusters ? 'active' : ''}`}
            onClick={() => setShowClusters(!showClusters)}
            title="Show Clusters"
          >
            👥
          </button>
        </div>
        
        <div className="control-group">
          <button 
            className="control-btn"
            onClick={onRecenter}
            title="Recenter Map"
          >
            ↻
          </button>
        </div>
        
        <div className="control-group">
          <button 
            className="control-btn"
            onClick={onShowAllStations}
            title="Show All Stations"
          >
            📍
          </button>
        </div>
        
        <div className="control-group">
          <button 
            className="control-btn"
            onClick={onShowCheapest}
            title={`Show Cheapest ${priceFilter !== 'all' ? priceFilter.toUpperCase() : 'Overall'}`}
          >
            🏆
          </button>
        </div>
      </div>
    </div>
  );
};

// Clickable station info overlay
const StationInfoOverlay: React.FC<{
  station: GasStation;
  onClose: () => void;
  onGetDirections: (station: GasStation) => void;
  priceFilter?: 'all' | 'diesel' | 'e5' | 'e10';
}> = ({ station, onClose, onGetDirections, priceFilter }) => {
  return (
    <div className="station-info-overlay">
      <div className="overlay-header">
        <div className="station-title">
          <h3>{station.name}</h3>
          <span className={`status-badge ${station.isOpen ? 'open' : 'closed'}`}>
            {station.isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
        <button className="close-overlay" onClick={onClose}>✕</button>
      </div>
      
      <div className="overlay-content">
        <div className="station-meta">
          <div className="station-brand">{station.brand}</div>
          <div className="station-location">
            📍 {station.street} {station.houseNumber}, {station.place}
          </div>
          <div className="station-distance">
            📏 {station.dist.toFixed(1)} km away
            {station.rating && (
              <span className="rating"> ⭐ {station.rating.toFixed(1)}</span>
            )}
          </div>
        </div>
        
        {/* Best price badges */}
        {station.isOverallBestPrice && (
          <div className="best-price-badge overall">
            👑 Best Overall Price: €{station.minPrice?.toFixed(3)}
          </div>
        )}
        
        {station.isBestForSelectedFuel && priceFilter !== 'all' && (
          <div className="best-price-badge fuel">
            🏆 Best {priceFilter?.toUpperCase()} Price
          </div>
        )}
        
        <div className="price-grid">
          <div className={`price-item ${station.isBestForSelectedFuel && priceFilter === 'diesel' ? 'best' : ''} ${station.isOverallBestPrice && station.minPrice === station.diesel ? 'overall-best' : ''}`}>
            <div className="fuel-type">Diesel</div>
            <div className="fuel-price">€{station.diesel.toFixed(3)}</div>
          </div>
          <div className={`price-item ${station.isBestForSelectedFuel && priceFilter === 'e5' ? 'best' : ''} ${station.isOverallBestPrice && station.minPrice === station.e5 ? 'overall-best' : ''}`}>
            <div className="fuel-type">E5</div>
            <div className="fuel-price">€{station.e5.toFixed(3)}</div>
          </div>
          <div className={`price-item ${station.isBestForSelectedFuel && priceFilter === 'e10' ? 'best' : ''} ${station.isOverallBestPrice && station.minPrice === station.e10 ? 'overall-best' : ''}`}>
            <div className="fuel-type">E10</div>
            <div className="fuel-price">€{station.e10.toFixed(3)}</div>
          </div>
        </div>
        
        {station.amenities && station.amenities.length > 0 && (
          <div className="amenities-section">
            <div className="section-title">Facilities:</div>
            <div className="amenities-list">
              {station.amenities.map((amenity, index) => (
                <span key={index} className="amenity-tag">
                  {amenity === 'Car Wash' ? '🚗' : 
                   amenity === 'Shop' ? '🛒' : 
                   amenity === '24/7' ? '⏰' : 
                   amenity === 'Cafe' ? '☕' : 
                   amenity === 'ATM' ? '🏧' : '✅'} {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="action-buttons">
          <button 
            className="action-btn directions"
            onClick={() => onGetDirections(station)}
          >
            🚗 Get Directions
          </button>
          <button 
            className="action-btn details"
            onClick={() => {
              // Scroll to station in list view (if integrated)
              const stationElement = document.getElementById(`station-${station.id}`);
              if (stationElement) {
                stationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                stationElement.classList.add('highlighted');
                setTimeout(() => stationElement.classList.remove('highlighted'), 2000);
              }
            }}
          >
            📋 View Details
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailedMapView: React.FC<DetailedMapViewProps> = ({
  stations,
  selectedStation,
  userLocation,
  onStationSelect,
  searchedLocation,
  mapLayer,
  showTraffic,
  onZoomChange,
  priceFilter = 'all'
}) => {
  const mapRef = useRef<L.Map>(null);
  const [showPriceCircles, setShowPriceCircles] = useState(false);
  const [priceCircleType, setPriceCircleType] = useState<'diesel' | 'e5' | 'e10'>('diesel');
  const [showClusters, setShowClusters] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [clickedStation, setClickedStation] = useState<GasStation | null>(null);
  const [showStationInfo, setShowStationInfo] = useState(false);

  // Calculate center
  const getCenter = (): [number, number] => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    if (stations.length > 0) {
      const avgLat = stations.reduce((sum, s) => sum + s.lat, 0) / stations.length;
      const avgLng = stations.reduce((sum, s) => sum + s.lng, 0) / stations.length;
      return [avgLat, avgLng];
    }
    return [52.52, 13.405]; // Berlin
  };

  // Get tile layer URL based on selected layer
  const getTileLayer = () => {
    switch (mapLayer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  // Get tile attribution
  const getAttribution = () => {
    switch (mapLayer) {
      case 'satellite':
        return 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'terrain':
        return 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)';
      default:
        return '© OpenStreetMap contributors';
    }
  };

  // Handle station click
  const handleStationClick = (station: GasStation) => {
    onStationSelect(station);
    setClickedStation(station);
    setShowStationInfo(true);
    
    // Center and zoom to station
    if (mapRef.current) {
      mapRef.current.setView([station.lat, station.lng], Math.max(currentZoom, 15));
    }
  };

  // Handle cluster click
  const handleClusterClick = (clusterStations: GasStation[]) => {
    if (clusterStations.length > 0) {
      const firstStation = clusterStations[0];
      handleStationClick(firstStation);
    }
  };

  // Handle recenter
  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
    } else if (stations.length > 0 && mapRef.current) {
      const center = getCenter();
      mapRef.current.setView(center, 13);
    }
  };

  // Show all stations by zooming out
  const handleShowAllStations = () => {
    if (mapRef.current && stations.length > 0) {
      const bounds = L.latLngBounds(stations.map(s => [s.lat, s.lng]));
      mapRef.current.fitBounds(bounds.pad(0.1));
    }
  };

  // Show cheapest station
  const handleShowCheapest = () => {
    let cheapestStation: GasStation | null = null;
    
    if (priceFilter === 'diesel') {
      cheapestStation = stations.reduce((cheapest, station) => 
        !cheapest || station.diesel < cheapest.diesel ? station : cheapest, null as GasStation | null
      );
    } else if (priceFilter === 'e5') {
      cheapestStation = stations.reduce((cheapest, station) => 
        !cheapest || station.e5 < cheapest.e5 ? station : cheapest, null as GasStation | null
      );
    } else if (priceFilter === 'e10') {
      cheapestStation = stations.reduce((cheapest, station) => 
        !cheapest || station.e10 < cheapest.e10 ? station : cheapest, null as GasStation | null
      );
    } else {
      cheapestStation = stations.reduce((cheapest, station) => {
        const stationMinPrice = Math.min(station.diesel, station.e5, station.e10);
        const cheapestMinPrice = cheapest ? Math.min(cheapest.diesel, cheapest.e5, cheapest.e10) : Infinity;
        return stationMinPrice < cheapestMinPrice ? station : cheapest;
      }, null as GasStation | null);
    }
    
    if (cheapestStation && mapRef.current) {
      handleStationClick(cheapestStation);
    }
  };

  // Handle zoom change
  const handleZoomChange = (zoom: number) => {
    setCurrentZoom(zoom);
    onZoomChange(zoom);
  };

  // Get amenity icon
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'car wash': return '🚗';
      case 'shop': return '🛒';
      case '24/7': return '⏰';
      case 'cafe': return '☕';
      case 'atm': return '🏧';
      default: return '✅';
    }
  };

  // Get directions
  const handleGetDirections = (station: GasStation) => {
    if (userLocation) {
      window.open(
        `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${station.lat},${station.lng}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`,
        '_blank'
      );
    }
  };

  // Close station info overlay
  const closeStationInfo = () => {
    setShowStationInfo(false);
    setClickedStation(null);
  };

  return (
    <div className="detailed-map-container">
      <MapContainer
        center={getCenter()}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
        className="detailed-map"
      >
        <ZoomControl position="topright" />
        <ScaleControl position="bottomleft" imperial={false} />
        
        {/* Base Layers */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={mapLayer === 'standard'} name="Street Map">
            <TileLayer
              attribution={getAttribution()}
              url={getTileLayer()}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={mapLayer === 'satellite'} name="Satellite">
            <TileLayer
              attribution={getAttribution()}
              url={getTileLayer()}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={mapLayer === 'terrain'} name="Terrain">
            <TileLayer
              attribution={getAttribution()}
              url={getTileLayer()}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Traffic layer (simulated) */}
        {showTraffic && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            opacity={0.3}
          />
        )}

        {/* Price gradient circles */}
        {showPriceCircles && stations.map(station => (
          <PriceGradientCircle
            key={`circle-${station.id}`}
            station={station}
            fuelType={priceCircleType}
            isSelected={selectedStation?.id === station.id}
          />
        ))}

        {/* Station clusters */}
        {showClusters && (
          <StationClusters 
            stations={stations} 
            onClusterClick={handleClusterClick}
            priceFilter={priceFilter}
          />
        )}

        {/* User location */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon(!searchedLocation || searchedLocation.name === 'Current Location')}
            >
              <Popup>
                <div className="user-popup">
                  <h4>{userLocation.name}</h4>
                  <div className="coordinates">
                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </div>
                  <button 
                    className="popup-btn"
                    onClick={() => handleRecenter()}
                  >
                    Center Map Here
                  </button>
                </div>
              </Popup>
            </Marker>
            
            {/* Range circle */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={5000} // 5km radius
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 2
              }}
            />
          </>
        )}

        {/* Stations */}
        {stations.map(station => (
          <React.Fragment key={station.id}>
            <Marker
              position={[station.lat, station.lng]}
              icon={createStationIcon(
                station.brand, 
                station.isOpen, 
                selectedStation?.id === station.id, 
                station.rating,
                station.isBestForSelectedFuel,
                station.isOverallBestPrice
              )}
              eventHandlers={{
                click: () => handleStationClick(station),
              }}
            >
              <Popup className="station-popup">
                <div className="popup-content">
                  <div className="popup-header">
                    <h4 className="station-name">{station.name}</h4>
                    <div className={`status-badge ${station.isOpen ? 'open' : 'closed'}`}>
                      {station.isOpen ? 'Open' : 'Closed'}
                    </div>
                  </div>
                  
                  <div className="popup-brand">{station.brand}</div>
                  
                  <div className="popup-location">
                    <span className="icon">📍</span>
                    {station.street} {station.houseNumber}, {station.place}
                  </div>
                  
                  <div className="popup-distance">
                    <span className="icon">📏</span>
                    {station.dist.toFixed(1)} km away
                    {station.rating && (
                      <span className="rating">
                        ⭐ {station.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  {/* Best price badges in popup */}
                  {station.isOverallBestPrice && (
                    <div className="best-price-popup overall">
                      👑 Best Overall Price
                    </div>
                  )}
                  
                  {station.isBestForSelectedFuel && priceFilter !== 'all' && (
                    <div className="best-price-popup fuel">
                      🏆 Best {priceFilter?.toUpperCase()} Price
                    </div>
                  )}
                  
                  {station.amenities && station.amenities.length > 0 && (
                    <div className="popup-amenities">
                      <div className="amenities-label">Facilities:</div>
                      <div className="amenities-icons">
                        {station.amenities.map((amenity, index) => (
                          <span key={index} className="amenity-icon" title={amenity}>
                            {getAmenityIcon(amenity)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="popup-prices">
                    <div className={`price-row ${station.isBestForSelectedFuel && priceFilter === 'diesel' ? 'best' : ''} ${station.isOverallBestPrice && station.minPrice === station.diesel ? 'overall-best' : ''}`}>
                      <span className="fuel-type">Diesel</span>
                      <span className="fuel-price">€{station.diesel.toFixed(3)}</span>
                    </div>
                    <div className={`price-row ${station.isBestForSelectedFuel && priceFilter === 'e5' ? 'best' : ''} ${station.isOverallBestPrice && station.minPrice === station.e5 ? 'overall-best' : ''}`}>
                      <span className="fuel-type">E5</span>
                      <span className="fuel-price">€{station.e5.toFixed(3)}</span>
                    </div>
                    <div className={`price-row ${station.isBestForSelectedFuel && priceFilter === 'e10' ? 'best' : ''} ${station.isOverallBestPrice && station.minPrice === station.e10 ? 'overall-best' : ''}`}>
                      <span className="fuel-type">E10</span>
                      <span className="fuel-price">€{station.e10.toFixed(3)}</span>
                    </div>
                  </div>
                  
                  <div className="popup-actions">
                    <button 
                      className="popup-btn directions"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(station);
                      }}
                    >
                      <span className="icon">🚗</span>
                      Get Directions
                    </button>
                    <button 
                      className="popup-btn details"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Scroll to station in list view
                        const stationElement = document.getElementById(`station-${station.id}`);
                        if (stationElement) {
                          stationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          stationElement.classList.add('highlighted');
                          setTimeout(() => stationElement.classList.remove('highlighted'), 2000);
                        }
                      }}
                    >
                      <span className="icon">📋</span>
                      View Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Selected station highlight */}
            {selectedStation?.id === station.id && (
              <Circle
                center={[station.lat, station.lng]}
                radius={60}
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.3,
                  weight: 4,
                  dashArray: '10, 5'
                }}
              />
            )}
          </React.Fragment>
        ))}

        <ZoomTracker onZoomChange={handleZoomChange} />
        
        {/* Custom Controls */}
        <CustomControls
          showPriceCircles={showPriceCircles}
          setShowPriceCircles={setShowPriceCircles}
          priceCircleType={priceCircleType}
          setPriceCircleType={setPriceCircleType}
          showClusters={showClusters}
          setShowClusters={setShowClusters}
          onRecenter={handleRecenter}
          onShowAllStations={handleShowAllStations}
          onShowCheapest={handleShowCheapest}
          priceFilter={priceFilter}
        />
      </MapContainer>

      {/* Station Info Overlay */}
      {showStationInfo && clickedStation && (
        <StationInfoOverlay
          station={clickedStation}
          onClose={closeStationInfo}
          onGetDirections={handleGetDirections}
          priceFilter={priceFilter}
        />
      )}

      {/* Zoom level display */}
      <div className="zoom-level-display">
        Zoom: {currentZoom}x • {stations.length} stations
      </div>

      {/* Loading overlay */}
      <div className="map-loading-overlay">
        <div className="loading-spinner"></div>
        <p>Loading map data...</p>
      </div>

      {/* Add CSS for clickable features */}
      <style jsx>{`
        .detailed-map-container {
          position: relative;
          height: 100%;
          width: 100%;
        }
        
        .clickable-marker {
          cursor: pointer !important;
          transition: transform 0.2s ease;
        }
        
        .clickable-marker:hover {
          transform: scale(1.1);
          z-index: 1000 !important;
        }
        
        .station-info-overlay {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          max-width: 400px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 1000;
          overflow: hidden;
        }
        
        .overlay-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          color: white;
        }
        
        .station-title {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .station-title h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-badge.open {
          background: #10B981;
          color: white;
        }
        
        .status-badge.closed {
          background: #EF4444;
          color: white;
        }
        
        .close-overlay {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        
        .close-overlay:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .overlay-content {
          padding: 20px;
        }
        
        .station-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .station-brand {
          font-weight: bold;
          color: #6B7280;
          font-size: 14px;
          text-transform: uppercase;
        }
        
        .station-location,
        .station-distance {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4B5563;
        }
        
        .rating {
          margin-left: 8px;
          font-weight: bold;
          color: #F59E0B;
        }
        
        .best-price-badge {
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .best-price-badge.overall {
          background: #FEF3C7;
          color: #92400E;
          border-left: 4px solid #F59E0B;
        }
        
        .best-price-badge.fuel {
          background: #D1FAE5;
          color: #065F46;
          border-left: 4px solid #10B981;
        }
        
        .price-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 20px 0;
        }
        
        .price-item {
          padding: 12px;
          border-radius: 8px;
          background: #F9FAFB;
          border: 2px solid #E5E7EB;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .price-item.best {
          border-color: #10B981;
          background: #D1FAE5;
        }
        
        .price-item.overall-best {
          border-color: #F59E0B;
          background: #FEF3C7;
        }
        
        .fuel-type {
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 4px;
        }
        
        .fuel-price {
          font-size: 18px;
          font-weight: bold;
          color: #111827;
        }
        
        .amenities-section {
          margin: 20px 0;
        }
        
        .section-title {
          font-weight: bold;
          margin-bottom: 8px;
          color: #4B5563;
        }
        
        .amenities-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .amenity-tag {
          padding: 4px 12px;
          background: #EFF6FF;
          border-radius: 16px;
          font-size: 12px;
          color: #1E40AF;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        
        .action-btn {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          border: none;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        
        .action-btn.directions {
          background: #3B82F6;
          color: white;
        }
        
        .action-btn.directions:hover {
          background: #2563EB;
        }
        
        .action-btn.details {
          background: #F3F4F6;
          color: #374151;
        }
        
        .action-btn.details:hover {
          background: #E5E7EB;
        }
        
        .zoom-level-display {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(255,255,255,0.9);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        
        .custom-controls {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .control-group {
          position: relative;
        }
        
        .control-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: white;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.3s ease;
        }
        
        .control-btn:hover {
          background: #F3F4F6;
        }
        
        .control-btn.active {
          background: #3B82F6;
          color: white;
        }
        
        .control-dropdown {
          position: absolute;
          top: 0;
          left: -120px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
          z-index: 1001;
        }
        
        .dropdown-btn {
          width: 100px;
          padding: 8px 12px;
          border: none;
          background: white;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
        }
        
        .dropdown-btn:hover {
          background: #F3F4F6;
        }
        
        .dropdown-btn.active {
          background: #3B82F6;
          color: white;
        }
        
        @media (max-width: 768px) {
          .station-info-overlay {
            top: 10px;
            left: 10px;
            right: 10px;
            max-width: none;
          }
          
          .price-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default DetailedMapView;