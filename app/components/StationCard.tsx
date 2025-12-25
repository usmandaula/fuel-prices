
import React from 'react';
import { 
  FaGasPump, 
  FaMapMarkerAlt, 
  FaRuler, 
  FaTrophy, 
  FaCrown,
  FaStar, 
  FaRegStar,
  FaCar,
  FaShoppingCart,
  FaCoffee,
  FaBuilding,
  FaHome,
  FaRoute,
  FaChevronRight
} from 'react-icons/fa';
import { StationCardProps } from '../types/gasStationTypes';
import { 
  getCheapestFuel, 
  formatAddress, 
  getAmenityIcon
} from '../utils/gasStationUtils';

import { formatPrice, formatDistance} from '../utils/formatUtils';
const StationCard: React.FC<StationCardProps> = ({
  station,
  isSelected,
  onSelect,
  sortBy,
  isBestForSelectedFuel = false,
  isOverallBestPrice = false,
  selectedFuelType = 'all',
  scrollToStation
}) => {
  const cheapestFuel = getCheapestFuel(station);
  const isCheapestDiesel = cheapestFuel.type === 'diesel';
  const isCheapestE5 = cheapestFuel.type === 'e5';
  const isCheapestE10 = cheapestFuel.type === 'e10';

  const handleSelect = () => {
    onSelect(station);
    if (scrollToStation) {
      scrollToStation(station.id);
    }
  };

  const renderAmenityIcon = (amenity: string) => {
    const iconName = getAmenityIcon(amenity);
    switch (iconName) {
      case 'car': return <FaCar key={amenity} className="amenity-icon" title="Car Wash" />;
      case 'shopping-cart': return <FaShoppingCart key={amenity} className="amenity-icon" title="Shop" />;
      case 'gas-pump': return <FaGasPump key={amenity} className="amenity-icon" title="24/7" />;
      case 'coffee': return <FaCoffee key={amenity} className="amenity-icon" title="Cafe" />;
      case 'building': return <FaBuilding key={amenity} className="amenity-icon" title="ATM" />;
      default: return <FaHome key={amenity} className="amenity-icon" title={amenity} />;
    }
  };

  return (
    <div 
      className={`station-card ${isSelected ? 'selected' : ''} ${station.isOpen ? 'open' : 'closed'} ${isBestForSelectedFuel ? 'best-price-for-fuel' : ''} ${isOverallBestPrice ? 'overall-best-price' : ''}`}
      onClick={handleSelect}
      id={`station-${station.id}`}
    >
      {isOverallBestPrice && selectedFuelType === 'all' && (
        <div className="overall-best-badge">
          <FaCrown />
          <span>Best Overall Price</span>
        </div>
      )}

      {isBestForSelectedFuel && selectedFuelType !== 'all' && (
        <div className="best-fuel-badge">
          <FaTrophy />
          <span>Best {selectedFuelType.toUpperCase()} Price</span>
        </div>
      )}

      <div className="card-header">
        <div className="station-info">
          <h3 className="station-name">
            <FaGasPump className="station-icon" />
            {station.name}
          </h3>
          <div className="station-meta">
            <span className={`status-badge ${station.isOpen ? 'open' : 'closed'}`}>
              {station.isOpen ? 'Open Now' : 'Closed'}
            </span>
            <span className="brand-badge">{station.brand}</span>
            {station.rating && (
              <div className="rating">
                {[...Array(5)].map((_, i) => (
                  i < Math.floor(station.rating!) ? 
                    <FaStar key={i} className="star filled" /> : 
                    <FaRegStar key={i} className="star" />
                ))}
                <span className="rating-value">{station.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="distance-indicator">
          <FaRuler className="distance-icon" />
          <span className="distance-value">{station.dist.toFixed(1)} km</span>
          {sortBy === 'distance' && <div className="sort-indicator"></div>}
        </div>
      </div>

      <div className="card-content">
        <div className="location-info">
          <FaMapMarkerAlt className="location-icon" />
          <span>{formatAddress(station)}</span>
        </div>

        <div className="prices-grid">
          <div className={`price-item ${isCheapestDiesel ? 'cheapest' : ''} ${sortBy === 'price_diesel' ? 'sorting' : ''} ${selectedFuelType === 'diesel' && station.isBestForSelectedFuel ? 'best-selected-fuel' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">Diesel</span>
              {isCheapestDiesel && (
                <span className="cheapest-tag">
                  <FaTrophy />
                  Best
                </span>
              )}
            </div>
            <div className="price-value">{formatPrice(station.diesel)}</div>
            {selectedFuelType === 'diesel' && station.isBestForSelectedFuel && (
              <div className="best-price-indicator">Best Price</div>
            )}
          </div>
          <div className={`price-item ${isCheapestE5 ? 'cheapest' : ''} ${sortBy === 'price_e5' ? 'sorting' : ''} ${selectedFuelType === 'e5' && station.isBestForSelectedFuel ? 'best-selected-fuel' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">E5</span>
              {isCheapestE5 && (
                <span className="cheapest-tag">
                  <FaTrophy />
                  Best
                </span>
              )}
            </div>
            <div className="price-value">{formatPrice(station.e5)}</div>
            {selectedFuelType === 'e5' && station.isBestForSelectedFuel && (
              <div className="best-price-indicator">Best Price</div>
            )}
          </div>
          <div className={`price-item ${isCheapestE10 ? 'cheapest' : ''} ${sortBy === 'price_e10' ? 'sorting' : ''} ${selectedFuelType === 'e10' && station.isBestForSelectedFuel ? 'best-selected-fuel' : ''}`}>
            <div className="fuel-label">
              <span className="fuel-name">E10</span>
              {isCheapestE10 && (
                <span className="cheapest-tag">
                  <FaTrophy />
                  Best
                </span>
              )}
            </div>
            <div className="price-value">{formatPrice(station.e10)}</div>
            {selectedFuelType === 'e10' && station.isBestForSelectedFuel && (
              <div className="best-price-indicator">Best Price</div>
            )}
          </div>
        </div>

        {selectedFuelType === 'all' && station.isOverallBestPrice && station.minPrice && (
          <div className="overall-best-price-highlight">
            <div className="overall-best-badge-inline">
              <FaCrown />
              <span>Best Overall Price: €{formatPrice(station.minPrice)}</span>
            </div>
          </div>
        )}

        {selectedFuelType !== 'all' && station.isBestForSelectedFuel && (
          <div className="selected-fuel-best-price">
            <div className="selected-fuel-best-badge">
              <FaTrophy />
              <span>Best {selectedFuelType.toUpperCase()} Price: €{
                selectedFuelType === 'diesel' ? formatPrice(station.diesel) :
                selectedFuelType === 'e5' ? formatPrice(station.e5) :
                formatPrice(station.e10)
              }</span>
            </div>
          </div>
        )}

        {station.amenities && station.amenities.length > 0 && (
          <div className="amenities">
            <div className="amenities-label">Facilities:</div>
            <div className="amenities-list">
              {station.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="amenity-tag">{amenity}</span>
              ))}
              {station.amenities.length > 3 && (
                <span className="amenity-more">+{station.amenities.length - 3}</span>
              )}
            </div>
            <div className="amenities-icons">
              {station.amenities.slice(0, 4).map((amenity, index) => renderAmenityIcon(amenity))}
            </div>
          </div>
        )}

        <div className="card-actions">
          <button className="action-btn directions">
            <FaRoute />
            Directions
          </button>
          <button className="action-btn details">
            <FaChevronRight />
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationCard;