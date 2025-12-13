"use client";

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaLocationArrow, FaSearchLocation } from 'react-icons/fa';

// Fix for default marker icons in Leaflet
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
}

interface MapViewProps {
  stations: GasStation[];
  selectedStation?: GasStation | null;
  userLocation?: { lat: number; lng: number; name?: string };
  onStationSelect: (station: GasStation) => void;
  onCenterUserLocation?: () => void;
  searchedLocation?: { lat: number; lng: number; name: string } | null;
}

// Component to handle recentering map
const RecenterControl: React.FC<{ 
  userLocation?: { lat: number; lng: number; name?: string };
  searchedLocation?: { lat: number; lng: number; name: string } | null;
}> = ({ userLocation, searchedLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation, map, searchedLocation]);

  return null;
};

// Component for custom location button
const LocationButton: React.FC<{ 
  userLocation?: { lat: number; lng: number; name?: string }; 
  onCenterUserLocation?: () => void;
  isCurrentLocation: boolean;
}> = ({ userLocation, onCenterUserLocation, isCurrentLocation }) => {
  const map = useMap();
  
  const handleClick = () => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
    if (onCenterUserLocation) {
      onCenterUserLocation();
    }
  };

  const Icon = isCurrentLocation ? FaLocationArrow : FaSearchLocation;
  const title = isCurrentLocation ? "Center on my location" : "Center on search location";

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <a 
          href="#" 
          title={title}
          onClick={(e) => {
            e.preventDefault();
            handleClick();
          }}
          className="custom-control-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
          }}
        >
          <Icon style={{ color: isCurrentLocation ? '#007bff' : '#28a745', fontSize: '20px' }} />
        </a>
      </div>
    </div>
  );
};

// Custom marker icons
const createMarkerIcon = (isOpen: boolean, isSelected: boolean = false) => {
  const color = isOpen ? '#28a745' : '#dc3545';
  const selectedColor = '#007bff';
  const size = isSelected ? 40 : 32;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${isSelected ? selectedColor : color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isSelected ? '18px' : '16px'};
        transition: all 0.2s ease;
      ">
        ⛽
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const createUserLocationIcon = (isCurrent: boolean = true) => {
  const color = isCurrent ? '#007bff' : '#28a745';
  const icon = isCurrent ? '📍' : '🔍';
  
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        animation: pulse 2s infinite;
      ">
        ${icon}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const MapView: React.FC<MapViewProps> = ({ 
  stations, 
  selectedStation, 
  userLocation,
  onStationSelect,
  onCenterUserLocation,
  searchedLocation
}) => {
  const mapRef = useRef<L.Map>(null);
  
  // Default center (Berlin)
  const defaultCenter: [number, number] = [52.52, 13.405];
  
  // Calculate center based on user location or stations
  const calculateCenter = (): [number, number] => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    
    if (stations.length === 0) return defaultCenter;
    
    const avgLat = stations.reduce((sum, s) => sum + s.lat, 0) / stations.length;
    const avgLng = stations.reduce((sum, s) => sum + s.lng, 0) / stations.length;
    return [avgLat, avgLng];
  };

  const center = calculateCenter();
  const isCurrentLocation = !searchedLocation || searchedLocation.name === 'Current Location';

  // Calculate zoom level
  const getZoomLevel = () => {
    if (userLocation && stations.length > 0) {
      return 13;
    }
    if (stations.length > 0) {
      return 12;
    }
    return 10;
  };

  return (
    <div className="map-container">
      <MapContainer 
        center={center} 
        zoom={getZoomLevel()} 
        style={{ height: '500px', width: '100%', borderRadius: '12px' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterControl userLocation={userLocation} searchedLocation={searchedLocation} />
        <LocationButton 
          userLocation={userLocation} 
          onCenterUserLocation={onCenterUserLocation}
          isCurrentLocation={isCurrentLocation}
        />
        
        {/* User location marker (current or searched) */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={createUserLocationIcon(isCurrentLocation)}
          >
            <Popup>
              <div className="map-popup">
                <h4>{isCurrentLocation ? '📍 Your Location' : '🔍 Search Location'}</h4>
                <p><strong>{userLocation.name}</strong></p>
                <p><strong>Coordinates:</strong></p>
                <p>{userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Station markers */}
        {stations.map(station => (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={createMarkerIcon(station.isOpen, selectedStation?.id === station.id)}
            eventHandlers={{
              click: () => {
                onStationSelect(station);
                // Optional: recenter map on selected station
                if (mapRef.current) {
                  mapRef.current.setView([station.lat, station.lng], 16);
                }
              },
            }}
          >
            <Popup>
              <div className="map-popup">
                <h4>⛽ {station.name}</h4>
                <p><strong>Brand:</strong> {station.brand}</p>
                <p><strong>Status:</strong> <span className={station.isOpen ? 'status-open' : 'status-closed'}>
                  {station.isOpen ? 'Open' : 'Closed'}
                </span></p>
                <p><strong>Diesel:</strong> €{station.diesel.toFixed(3)}</p>
                <p><strong>E5:</strong> €{station.e5.toFixed(3)}</p>
                <p><strong>E10:</strong> €{station.e10.toFixed(3)}</p>
                <p><strong>Distance:</strong> {station.dist.toFixed(1)} km</p>
                {userLocation && (
                  <a 
                    href={`https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${station.lat},${station.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="directions-link"
                  >
                    Get Directions
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Draw line to selected station if user location is available */}
        {userLocation && selectedStation && (
          <Polyline
            positions={[
              [userLocation.lat, userLocation.lng],
              [selectedStation.lat, selectedStation.lng]
            ]}
            color={isCurrentLocation ? "#007bff" : "#28a745"}
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;