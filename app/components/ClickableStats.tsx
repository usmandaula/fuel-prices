import React from 'react';
import { FaExternalLinkAlt, FaCrown } from 'react-icons/fa';
import { ClickableStatsProps, FuelType } from '../types/gasStationTypes';

const ClickableStats: React.FC<ClickableStatsProps> = ({
  bestPrices,
  onPriceClick,
  openStationsCount,
  sortedStationsLength,
  averagePrice,
  selectedFuelType,
  isMapView = false
}) => {
  return (
    <div className="stats-grid">
      <div className="stat-item">
        <div className="stat-value">{openStationsCount}</div>
        <div className="stat-label">Open Now</div>
      </div>
      
      <div className="stat-item">
        <div className="stat-value">€{averagePrice}</div>
        <div className="stat-label">Avg Price</div>
      </div>
      
      <div 
        className={`stat-item clickable-stat ${selectedFuelType === 'diesel' ? 'active' : ''}`}
        onClick={() => bestPrices.diesel && onPriceClick(bestPrices.diesel.stationId, 'diesel')}
        title={bestPrices.diesel ? 
          `Click to ${isMapView ? 'fly to' : 'view'} ${bestPrices.diesel.stationName}` : 
          'No best price available'}
      >
        <div className="stat-value">
          {bestPrices.diesel ? (
            <div className="best-price-value">
              <span>€{bestPrices.diesel.price.toFixed(3)}</span>
              <FaExternalLinkAlt className="stat-link-icon" />
            </div>
          ) : '-'}
        </div>
        <div className="stat-label">Best Diesel</div>
      </div>
      
      <div 
        className={`stat-item clickable-stat ${selectedFuelType === 'e5' ? 'active' : ''}`}
        onClick={() => bestPrices.e5 && onPriceClick(bestPrices.e5.stationId, 'e5')}
        title={bestPrices.e5 ? 
          `Click to ${isMapView ? 'fly to' : 'view'} ${bestPrices.e5.stationName}` : 
          'No best price available'}
      >
        <div className="stat-value">
          {bestPrices.e5 ? (
            <div className="best-price-value">
              <span>€{bestPrices.e5.price.toFixed(3)}</span>
              <FaExternalLinkAlt className="stat-link-icon" />
            </div>
          ) : '-'}
        </div>
        <div className="stat-label">Best E5</div>
      </div>
      
      <div 
        className={`stat-item clickable-stat ${selectedFuelType === 'e10' ? 'active' : ''}`}
        onClick={() => bestPrices.e10 && onPriceClick(bestPrices.e10.stationId, 'e10')}
        title={bestPrices.e10 ? 
          `Click to ${isMapView ? 'fly to' : 'view'} ${bestPrices.e10.stationName}` : 
          'No best price available'}
      >
        <div className="stat-value">
          {bestPrices.e10 ? (
            <div className="best-price-value">
              <span>€{bestPrices.e10.price.toFixed(3)}</span>
              <FaExternalLinkAlt className="stat-link-icon" />
            </div>
          ) : '-'}
        </div>
        <div className="stat-label">Best E10</div>
      </div>
      
      <div 
        className={`stat-item clickable-stat ${selectedFuelType === 'all' ? 'active' : ''}`}
        onClick={() => bestPrices.overall && onPriceClick(bestPrices.overall.stationId, bestPrices.overall.type)}
        title={bestPrices.overall ? 
          `Click to ${isMapView ? 'fly to' : 'view'} ${bestPrices.overall.stationName}` : 
          'No best price available'}
      >
        <div className="stat-value">
          {bestPrices.overall ? (
            <div className="best-price-value">
              <span>€{bestPrices.overall.price.toFixed(3)}</span>
              <FaCrown className="stat-crown-icon" />
            </div>
          ) : '-'}
        </div>
        <div className="stat-label">Best Overall</div>
      </div>
    </div>
  );
};

export default ClickableStats;