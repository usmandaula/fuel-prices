import React from 'react';
import { 
  FaGasPump, 
  FaMoneyBillWave, 
  FaExternalLinkAlt,
  FaCrown,
  FaTrophy,
  FaStore,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { ClickableStatsProps } from '../types/gasStationTypes';

const ClickableStats: React.FC<ClickableStatsProps> = ({
  bestPrices,
  onPriceClick,
  openStationsCount,
  sortedStationsLength,
  averagePrice,
  selectedFuelType,
  isMapView = false
}) => {
  // Safe price formatting function
  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'N/A';
    }
    return `€${price.toFixed(3)}`;
  };

  // Safe handler for price clicks
  const handlePriceClick = (stationId: string | undefined, fuelType?: any) => {
    if (stationId && onPriceClick) {
      onPriceClick(stationId, fuelType);
    }
  };

  return (
    <div className={`clickable-stats ${isMapView ? 'map-view' : 'list-view'}`}>
      {/* Overall Best Price */}
      <div 
        className={`stat-item overall-best ${!bestPrices.overall ? 'disabled' : ''}`}
        onClick={() => bestPrices.overall && handlePriceClick(bestPrices.overall.stationId, bestPrices.overall.type)}
      >
        <div className="stat-icon">
          <FaCrown />
        </div>
        <div className="stat-content">
          <div className="stat-label">Best Overall</div>
          <div className="stat-value">
            {bestPrices.overall ? formatPrice(bestPrices.overall.price) : 'N/A'}
          </div>
          <div className="stat-station">
            {bestPrices.overall?.stationName || 'No station'}
          </div>
        </div>
        {bestPrices.overall && (
          <FaExternalLinkAlt className="stat-link-icon" />
        )}
      </div>

      {/* Diesel Best Price */}
      <div 
        className={`stat-item diesel ${!bestPrices.diesel ? 'disabled' : ''} ${selectedFuelType === 'diesel' ? 'selected' : ''}`}
        onClick={() => bestPrices.diesel && handlePriceClick(bestPrices.diesel.stationId, 'diesel')}
      >
        <div className="stat-icon">
          <FaGasPump />
        </div>
        <div className="stat-content">
          <div className="stat-label">Best Diesel</div>
          <div className="stat-value">
            {bestPrices.diesel ? formatPrice(bestPrices.diesel.price) : 'N/A'}
          </div>
          <div className="stat-station">
            {bestPrices.diesel?.stationName || 'No station'}
          </div>
        </div>
        {bestPrices.diesel && (
          <FaExternalLinkAlt className="stat-link-icon" />
        )}
      </div>

      {/* E5 Best Price */}
      <div 
        className={`stat-item e5 ${!bestPrices.e5 ? 'disabled' : ''} ${selectedFuelType === 'e5' ? 'selected' : ''}`}
        onClick={() => bestPrices.e5 && handlePriceClick(bestPrices.e5.stationId, 'e5')}
      >
        <div className="stat-icon">
          <FaGasPump />
        </div>
        <div className="stat-content">
          <div className="stat-label">Best E5</div>
          <div className="stat-value">
            {bestPrices.e5 ? formatPrice(bestPrices.e5.price) : 'N/A'}
          </div>
          <div className="stat-station">
            {bestPrices.e5?.stationName || 'No station'}
          </div>
        </div>
        {bestPrices.e5 && (
          <FaExternalLinkAlt className="stat-link-icon" />
        )}
      </div>

      {/* E10 Best Price */}
      <div 
        className={`stat-item e10 ${!bestPrices.e10 ? 'disabled' : ''} ${selectedFuelType === 'e10' ? 'selected' : ''}`}
        onClick={() => bestPrices.e10 && handlePriceClick(bestPrices.e10.stationId, 'e10')}
      >
        <div className="stat-icon">
          <FaGasPump />
        </div>
        <div className="stat-content">
          <div className="stat-label">Best E10</div>
          <div className="stat-value">
            {bestPrices.e10 ? formatPrice(bestPrices.e10.price) : 'N/A'}
          </div>
          <div className="stat-station">
            {bestPrices.e10?.stationName || 'No station'}
          </div>
        </div>
        {bestPrices.e10 && (
          <FaExternalLinkAlt className="stat-link-icon" />
        )}
      </div>

      {/* Station Stats */}
      <div className="stat-item stations">
        <div className="stat-icon">
          <FaStore />
        </div>
        <div className="stat-content">
          <div className="stat-label">Stations</div>
          <div className="stat-value">{openStationsCount}/{sortedStationsLength}</div>
          <div className="stat-station">Open/Total</div>
        </div>
      </div>

      {/* Average Price */}
      <div className="stat-item average">
        <div className="stat-icon">
          <FaMoneyBillWave />
        </div>
        <div className="stat-content">
          <div className="stat-label">Avg Price</div>
          <div className="stat-value">
            {averagePrice && !isNaN(parseFloat(averagePrice)) 
              ? `€${parseFloat(averagePrice).toFixed(3)}` 
              : 'N/A'}
          </div>
          <div className="stat-station">All Fuels</div>
        </div>
      </div>
    </div>
  );
};

export default ClickableStats;