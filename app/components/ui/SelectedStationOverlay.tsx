import React from 'react';
import { FaTimes, FaRoute } from 'react-icons/fa';
import { GasStation } from '../types/gasStationTypes';
import PriceDisplay from './PriceDisplay';

interface SelectedStationOverlayProps {
  station: GasStation;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  onClose: () => void;
  onGetDirections: () => void;
}

const SelectedStationOverlay: React.FC<SelectedStationOverlayProps> = ({
  station,
  priceFilter,
  onClose,
  onGetDirections
}) => {
  return (
    <div className="selected-overlay">
      <div className="overlay-header">
        <h3>{station.name}</h3>
        <button 
          className="close-overlay"
          onClick={onClose}
        >
          <FaTimes />
        </button>
      </div>
      <div className="overlay-content">
        <div className="overlay-prices">
          <PriceDisplay 
            fuelType="Diesel"
            price={station.diesel}
            isBestPrice={station.isBestForSelectedFuel && priceFilter === 'diesel'}
            isOverallBest={station.isOverallBestPrice && station.minPrice === station.diesel && priceFilter === 'all'}
          />
          <PriceDisplay 
            fuelType="E5"
            price={station.e5}
            isBestPrice={station.isBestForSelectedFuel && priceFilter === 'e5'}
            isOverallBest={station.isOverallBestPrice && station.minPrice === station.e5 && priceFilter === 'all'}
          />
          <PriceDisplay 
            fuelType="E10"
            price={station.e10}
            isBestPrice={station.isBestForSelectedFuel && priceFilter === 'e10'}
            isOverallBest={station.isOverallBestPrice && station.minPrice === station.e10 && priceFilter === 'all'}
          />
        </div>
        <button 
          className="get-directions-btn"
          onClick={onGetDirections}
        >
          <FaRoute />
          Get Directions ({station.dist.toFixed(1)} km)
        </button>
      </div>
    </div>
  );
};

export default SelectedStationOverlay;