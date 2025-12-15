import React from 'react';
import { FaMapMarkerAlt, FaLocationArrow } from 'react-icons/fa';

interface FooterProps {
  userLocation: { lat: number; lng: number; name?: string } | undefined;
  isLocating: boolean;
  dataSource: string;
  getUserLocation: () => void;
  gasStationData?: any;
}

const Footer: React.FC<FooterProps> = ({
  userLocation,
  isLocating,
  dataSource,
  getUserLocation,
  gasStationData
}) => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="location-info">
            <FaMapMarkerAlt />
            {userLocation?.name || 'Locating...'}
          </span>
          {isLocating && (
            <span className="locating-indicator">
              <div className="pulse-dot"></div>
              Locating...
            </span>
          )}
        </div>
        <div className="footer-center">
          <span className="data-source">
            Data: {dataSource} • Map: OpenStreetMap • API: {gasStationData?.license || 'Tankerkönig API'}
          </span>
        </div>
        <div className="footer-right">
          <button 
            className="refresh-btn"
            onClick={getUserLocation}
            disabled={isLocating}
          >
            <FaLocationArrow />
            {isLocating ? 'Updating...' : 'Refresh Location'}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;