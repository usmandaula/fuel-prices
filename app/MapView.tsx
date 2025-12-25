"use client";

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaGasPump, FaMapMarkerAlt } from 'react-icons/fa';

// Fix for default marker icons
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
  searchedLocation?: { lat: number; lng: number; name: string } | null;
}

// Recenter control
const RecenterControl: React.FC<{ userLocation?: { lat: number; lng: number; name?: string } }> = ({ userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation, map]);

  return null;
};

// Custom markers
const createMarkerIcon = (isOpen: boolean, isSelected: boolean = false) => {
  const color = isOpen ? '#10b981' : '#ef4444';
  const selectedColor = '#3b82f6';
  const size = isSelected ? 32 : 24;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${isSelected ? selectedColor : color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        ⛽
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const createUserLocationIcon = (isCurrent: boolean = true) => {
  const color = isCurrent ? '#3b82f6' : '#10b981';
  
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">
        ${isCurrent ? '📍' : '🔍'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const MapView: React.FC<MapViewProps> = ({ 
  stations, 
  selectedStation, 
  userLocation,
  onStationSelect,
  searchedLocation
}) => {
  const mapRef = useRef<L.Map>(null);
  const isCurrentLocation = !searchedLocation || searchedLocation.name === 'Current Location';
  
  // Calculate center
  const getCenter = (): [number, number] => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    return stations.length > 0 
      ? [stations[0].lat, stations[0].lng]
      : [52.52, 13.405]; // Berlin
  };

  return (
    <div className="map-compact">
      <MapContainer 
        center={getCenter()} 
        zoom={13} 
        style={{ height: '400px', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterControl userLocation={userLocation} />
        
        {/* User location */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={createUserLocationIcon(isCurrentLocation)}
          >
            <Popup>
              <div className="popup-compact">
                <strong>{userLocation.name}</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Stations */}
        {stations.map(station => (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={createMarkerIcon(station.isOpen, selectedStation?.id === station.id)}
            eventHandlers={{
              click: () => {
                onStationSelect(station);
                if (mapRef.current) {
                  mapRef.current.setView([station.lat, station.lng], 15);
                }
              },
            }}
          >
            <Popup>
              <div className="popup-compact">
                <div className="popup-header">
                  <FaGasPump className="icon-sm" />
                  <strong>{station.name}</strong>
                </div>
                <div className="popup-content">
                  <div><strong>{station.brand}</strong></div>
                  <div>{station.dist.toFixed(1)} km away</div>
                  <div className="popup-prices">
                    <div>D: €{station.diesel.toFixed(3)}</div>
                    <div>E5: €{station.e5.toFixed(3)}</div>
                    <div>E10: €{station.e10.toFixed(3)}</div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;