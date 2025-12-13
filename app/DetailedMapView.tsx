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
}

// Custom icons with brand colors
const createStationIcon = (brand: string, isOpen: boolean, isSelected: boolean, rating?: number) => {
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
  const size = isSelected ? 48 : rating && rating > 4 ? 40 : 32;
  const borderColor = isSelected ? '#3B82F6' : isOpen ? '#10B981' : '#EF4444';
  const borderWidth = isSelected ? 4 : 2;
  const shadowSize = isSelected ? 8 : 4;

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
    ">
      ⛽
      ${rating && rating > 4 ? `
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #F59E0B;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          border: 2px solid white;
        ">
          ★
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'station-marker',
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
    className: 'user-marker',
    html: iconHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Price gradient circle for heatmap-like visualization
const PriceGradientCircle: React.FC<{ 
  station: GasStation;
  fuelType: 'diesel' | 'e5' | 'e10';
}> = ({ station, fuelType }) => {
  const price = station[fuelType];
  const radius = Math.max(30, Math.min(150, (2.0 - price) * 100)); // Adjust radius based on price
  
  let color = '#10B981'; // Green for cheap
  if (price > 1.5) color = '#EF4444'; // Red for expensive
  else if (price > 1.3) color = '#F59E0B'; // Orange for medium

  return (
    <Circle
      center={[station.lat, station.lng]}
      radius={radius}
      pathOptions={{
        fillColor: color,
        color: color,
        fillOpacity: 0.1,
        weight: 1,
        opacity: 0.5
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
const StationClusters: React.FC<{ stations: GasStation[] }> = ({ stations }) => {
  const map = useMap();
  
  // Group stations by location clusters
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
        const avgPrice = clusterStations.reduce((sum, s) => sum + s.diesel, 0) / clusterStations.length;
        
        const clusterSize = Math.min(60, 30 + clusterStations.length * 5);
        const color = avgPrice > 1.5 ? '#EF4444' : avgPrice > 1.3 ? '#F59E0B' : '#10B981';
        
        const icon = L.divIcon({
          className: 'cluster-marker',
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
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ">
              ${clusterStations.length}
            </div>
          `,
          iconSize: [clusterSize, clusterSize],
          iconAnchor: [clusterSize / 2, clusterSize / 2]
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        clusterMarkers.push(marker);
      }
    });

    return () => {
      clusterMarkers.forEach(marker => map.removeLayer(marker));
    };
  }, [stations, map]);

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
}> = ({ 
  showPriceCircles, 
  setShowPriceCircles, 
  priceCircleType, 
  setPriceCircleType,
  showClusters,
  setShowClusters,
  onRecenter
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
        
        <button 
          className={`control-btn ${showClusters ? 'active' : ''}`}
          onClick={() => setShowClusters(!showClusters)}
          title="Show Clusters"
        >
          👥
        </button>
        
        <button 
          className="control-btn"
          onClick={onRecenter}
          title="Recenter Map"
        >
          ↻
        </button>
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
  onZoomChange
}) => {
  const mapRef = useRef<L.Map>(null);
  const [showPriceCircles, setShowPriceCircles] = useState(false);
  const [priceCircleType, setPriceCircleType] = useState<'diesel' | 'e5' | 'e10'>('diesel');
  const [showClusters, setShowClusters] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);

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
    if (mapRef.current) {
      mapRef.current.setView([station.lat, station.lng], Math.max(currentZoom, 15));
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
          />
        ))}

        {/* Station clusters */}
        {showClusters && <StationClusters stations={stations} />}

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
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={createStationIcon(station.brand, station.isOpen, selectedStation?.id === station.id, station.rating)}
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
                  <div className="price-row">
                    <span className="fuel-type">Diesel</span>
                    <span className="fuel-price">€{station.diesel.toFixed(3)}</span>
                  </div>
                  <div className="price-row">
                    <span className="fuel-type">E5</span>
                    <span className="fuel-price">€{station.e5.toFixed(3)}</span>
                  </div>
                  <div className="price-row">
                    <span className="fuel-type">E10</span>
                    <span className="fuel-price">€{station.e10.toFixed(3)}</span>
                  </div>
                </div>
                
                <div className="popup-actions">
                  <button 
                    className="popup-btn directions"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (userLocation) {
                        window.open(
                          `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${station.lat},${station.lng}`,
                          '_blank'
                        );
                      }
                    }}
                  >
                    <span className="icon">🚗</span>
                    Get Directions
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Selected station highlight */}
        {selectedStation && (
          <Circle
            center={[selectedStation.lat, selectedStation.lng]}
            radius={50}
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.2,
              weight: 3,
              dashArray: '5, 5'
            }}
          />
        )}

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
        />
      </MapContainer>

      {/* Zoom level display */}
      <div className="zoom-level-display">
        Zoom: {currentZoom}x
      </div>

      {/* Loading overlay */}
      <div className="map-loading-overlay">
        <div className="loading-spinner"></div>
        <p>Loading map data...</p>
      </div>
    </div>
  );
};

export default DetailedMapView;