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
import 'leaflet.heat';
import { FaGasPump, FaStar, FaCar, FaShoppingCart, FaCoffee } from 'react-icons/fa';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

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
      animation: pulse 2s infinite;
    ">
      <div style="
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
      "></div>
      <div style="
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid ${color}44;
        border-radius: 50%;
        animation: ripple 2s infinite;
      "></div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes ripple {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  return L.divIcon({
    className: 'user-marker',
    html: iconHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
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

// Heatmap layer component
const HeatmapLayer: React.FC<{ stations: GasStation[], fuelType: 'diesel' | 'e5' | 'e10' }> = ({ stations, fuelType }) => {
  const map = useMap();
  
  useEffect(() => {
    if ((window as any).L && (window as any).L.heatLayer) {
      const heatData = stations.map(station => [
        station.lat,
        station.lng,
        Math.max(0.1, 1 - ((station[fuelType] as number) / 2))
      ]);
      
      const heatLayer = (window as any).L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.1: '#00FF00',
          0.5: '#FFFF00',
          1.0: '#FF0000'
        }
      }).addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };
    }
  }, [stations, fuelType, map]);

  return null;
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
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapType, setHeatmapType] = useState<'diesel' | 'e5' | 'e10'>('diesel');

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

  // Get station amenities icons
  const getAmenityIcons = (amenities?: string[]) => {
    if (!amenities) return [];
    return amenities.map(amenity => {
      switch (amenity.toLowerCase()) {
        case 'car wash':
          return <FaCar key={amenity} className="amenity-icon" title="Car Wash" />;
        case 'shop':
          return <FaShoppingCart key={amenity} className="amenity-icon" title="Shop" />;
        case '24/7':
          return <FaGasPump key={amenity} className="amenity-icon" title="24/7" />;
        case 'cafe':
          return <FaCoffee key={amenity} className="amenity-icon" title="Cafe" />;
        default:
          return null;
      }
    }).filter(Boolean);
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

        {/* Heatmap overlay */}
        {showHeatmap && <HeatmapLayer stations={stations} fuelType={heatmapType} />}

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
        {stations.map(station => {
          const amenities = getAmenityIcons(station.amenities);
          return (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createStationIcon(station.brand, station.isOpen, selectedStation?.id === station.id, station.rating)}
              eventHandlers={{
                click: () => {
                  onStationSelect(station);
                  if (mapRef.current) {
                    mapRef.current.setView([station.lat, station.lng], 16);
                  }
                },
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
                    <FaMapMarkerAlt className="icon" />
                    {station.street} {station.houseNumber}, {station.place}
                  </div>
                  
                  <div className="popup-distance">
                    <FaStar className="icon" />
                    {station.dist.toFixed(1)} km away
                    {station.rating && (
                      <span className="rating">
                        ★ {station.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  {amenities.length > 0 && (
                    <div className="popup-amenities">
                      <div className="amenities-label">Facilities:</div>
                      <div className="amenities-icons">{amenities}</div>
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
                      onClick={() => window.open(
                        `https://www.google.com/maps/dir/${userLocation?.lat},${userLocation?.lng}/${station.lat},${station.lng}`,
                        '_blank'
                      )}
                    >
                      <FaRoute className="icon" />
                      Get Directions
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

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

        <ZoomTracker onZoomChange={onZoomChange} />
      </MapContainer>

      {/* Heatmap Controls */}
      <div className="heatmap-controls">
        <button 
          className={`heatmap-toggle ${showHeatmap ? 'active' : ''}`}
          onClick={() => setShowHeatmap(!showHeatmap)}
        >
          Heatmap
        </button>
        {showHeatmap && (
          <div className="heatmap-type">
            <button 
              className={`heatmap-btn ${heatmapType === 'diesel' ? 'active' : ''}`}
              onClick={() => setHeatmapType('diesel')}
            >
              Diesel
            </button>
            <button 
              className={`heatmap-btn ${heatmapType === 'e5' ? 'active' : ''}`}
              onClick={() => setHeatmapType('e5')}
            >
              E5
            </button>
            <button 
              className={`heatmap-btn ${heatmapType === 'e10' ? 'active' : ''}`}
              onClick={() => setHeatmapType('e10')}
            >
              E10
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedMapView;