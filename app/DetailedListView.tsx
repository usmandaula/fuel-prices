"use client";

import React, { useState } from 'react';
import {
  FaGasPump,
  FaMapMarkerAlt,
  FaRuler,
  FaMoneyBillWave,
  FaStar,
  FaRegStar,
  FaPhone,
  FaClock,
  FaCar,
  FaShoppingCart,
  FaCoffee,
  FaBuilding,
  FaDirections,
  FaHeart,
  FaRegHeart,
  FaBookmark,
  FaRegBookmark,
  FaShare,
  FaCopy,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaExchangeAlt,
  FaChartLine,
  FaInfoCircle
} from 'react-icons/fa';

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
  lastUpdated?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  services?: string[];
  isFavorite?: boolean;
}

interface DetailedListViewProps {
  stations: GasStation[];
  selectedStation: GasStation | null;
  onStationSelect: (station: GasStation) => void;
  listLayout: 'compact' | 'detailed' | 'table';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  userLocation?: { lat: number; lng: number; name?: string };
}

const DetailedListView: React.FC<DetailedListViewProps> = ({
  stations,
  selectedStation,
  onStationSelect,
  listLayout,
  sortBy,
  sortDirection,
  userLocation
}) => {
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleExpand = (stationId: string) => {
    const newExpanded = new Set(expandedStations);
    if (newExpanded.has(stationId)) {
      newExpanded.delete(stationId);
    } else {
      newExpanded.add(stationId);
    }
    setExpandedStations(newExpanded);
  };

  const toggleFavorite = (stationId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(stationId)) {
      newFavorites.delete(stationId);
    } else {
      newFavorites.add(stationId);
    }
    setFavorites(newFavorites);
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'car wash': return <FaCar key={amenity} className="amenity-icon" title="Car Wash" />;
      case 'shop': return <FaShoppingCart key={amenity} className="amenity-icon" title="Shop" />;
      case '24/7': return <FaClock key={amenity} className="amenity-icon" title="24/7" />;
      case 'cafe': return <FaCoffee key={amenity} className="amenity-icon" title="Cafe" />;
      case 'atm': return <FaBuilding key={amenity} className="amenity-icon" title="ATM" />;
      default: return <FaInfoCircle key={amenity} className="amenity-icon" title={amenity} />;
    }
  };

  const getPriceDifference = (station: GasStation, fuelType: 'diesel' | 'e5' | 'e10') => {
    if (stations.length < 2) return null;
    
    const prices = stations.map(s => s[fuelType]);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const difference = station[fuelType] - avgPrice;
    const percentage = (difference / avgPrice) * 100;
    
    return {
      difference,
      percentage,
      isCheaper: difference < 0
    };
  };

  // Table layout
  if (listLayout === 'table') {
    return (
      <div className="table-view">
        <table className="stations-table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Brand</th>
              <th>Status</th>
              <th>Distance</th>
              <th>Diesel</th>
              <th>E5</th>
              <th>E10</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => {
              const dieselDiff = getPriceDifference(station, 'diesel');
              const e5Diff = getPriceDifference(station, 'e5');
              const e10Diff = getPriceDifference(station, 'e10');
              
              return (
                <tr 
                  key={station.id}
                  className={`table-row ${selectedStation?.id === station.id ? 'selected' : ''} ${expandedStations.has(station.id) ? 'expanded' : ''}`}
                  onClick={() => onStationSelect(station)}
                >
                  <td className="station-cell">
                    <div className="station-info-table">
                      <FaGasPump className="station-icon" />
                      <div>
                        <div className="station-name-table">{station.name}</div>
                        <div className="station-address-table">
                          {station.street} {station.houseNumber}, {station.place}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="brand-badge-table">{station.brand}</span>
                  </td>
                  <td>
                    <span className={`status-badge-table ${station.isOpen ? 'open' : 'closed'}`}>
                      {station.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td>
                    <div className="distance-cell">
                      <FaRuler className="icon" />
                      {station.dist.toFixed(1)} km
                    </div>
                  </td>
                  <td>
                    <div className="price-cell">
                      <div className="price-value">€{station.diesel.toFixed(3)}</div>
                      {dieselDiff && (
                        <div className={`price-diff ${dieselDiff.isCheaper ? 'cheaper' : 'expensive'}`}>
                          {dieselDiff.isCheaper ? '▼' : '▲'} {Math.abs(dieselDiff.percentage).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="price-cell">
                      <div className="price-value">€{station.e5.toFixed(3)}</div>
                      {e5Diff && (
                        <div className={`price-diff ${e5Diff.isCheaper ? 'cheaper' : 'expensive'}`}>
                          {e5Diff.isCheaper ? '▼' : '▲'} {Math.abs(e5Diff.percentage).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="price-cell">
                      <div className="price-value">€{station.e10.toFixed(3)}</div>
                      {e10Diff && (
                        <div className={`price-diff ${e10Diff.isCheaper ? 'cheaper' : 'expensive'}`}>
                          {e10Diff.isCheaper ? '▼' : '▲'} {Math.abs(e10Diff.percentage).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {station.rating ? (
                      <div className="rating-cell">
                        <div className="stars">
                          {[...Array(5)].map((_, i) => (
                            i < Math.floor(station.rating!) ? 
                              <FaStar key={i} className="star filled" /> : 
                              <FaRegStar key={i} className="star" />
                          ))}
                        </div>
                        <span className="rating-value">{station.rating.toFixed(1)}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="action-buttons-table">
                      <button 
                        className="action-btn-table"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(station.id);
                        }}
                      >
                        {favorites.has(station.id) ? <FaHeart className="filled" /> : <FaRegHeart />}
                      </button>
                      <button 
                        className="action-btn-table"
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
                        <FaDirections />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Detailed card layout
  if (listLayout === 'detailed') {
    return (
      <div className="detailed-list-view">
        {stations.map((station) => {
          const isExpanded = expandedStations.has(station.id);
          const isFavorite = favorites.has(station.id);
          const cheapestFuel = Math.min(station.diesel, station.e5, station.e10);
          const isCheapestDiesel = cheapestFuel === station.diesel;
          const isCheapestE5 = cheapestFuel === station.e5;
          const isCheapestE10 = cheapestFuel === station.e10;

          const dieselDiff = getPriceDifference(station, 'diesel');
          const e5Diff = getPriceDifference(station, 'e5');
          const e10Diff = getPriceDifference(station, 'e10');

          return (
            <div 
              key={station.id}
              className={`detailed-station-card ${selectedStation?.id === station.id ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => onStationSelect(station)}
            >
              <div className="card-header-detailed">
                <div className="station-main-info">
                  <div className="station-brand-header">
                    <div className="brand-logo">{station.brand.charAt(0)}</div>
                    <div className="station-title">
                      <h3 className="station-name-detailed">{station.name}</h3>
                      <div className="station-subtitle">
                        <span className="station-brand-detailed">{station.brand}</span>
                        <span className="station-address-detailed">
                          <FaMapMarkerAlt className="icon" />
                          {station.street} {station.houseNumber}, {station.place}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="station-quick-stats">
                    <div className="quick-stat">
                      <FaRuler className="icon" />
                      <span className="stat-value">{station.dist.toFixed(1)} km</span>
                      <span className="stat-label">Distance</span>
                    </div>
                    <div className="quick-stat">
                      <FaMoneyBillWave className="icon" />
                      <span className="stat-value">€{cheapestFuel.toFixed(3)}</span>
                      <span className="stat-label">Best Price</span>
                    </div>
                    {station.rating && (
                      <div className="quick-stat">
                        <FaStar className="icon" />
                        <span className="stat-value">{station.rating.toFixed(1)}</span>
                        <span className="stat-label">Rating</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-actions-header">
                  <button 
                    className={`status-badge-detailed ${station.isOpen ? 'open' : 'closed'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(station.id);
                    }}
                  >
                    {station.isOpen ? 'Open Now' : 'Closed'}
                  </button>
                  
                  <div className="action-buttons-header">
                    <button 
                      className="action-btn-header favorite"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(station.id);
                      }}
                    >
                      {isFavorite ? <FaHeart className="filled" /> : <FaRegHeart />}
                    </button>
                    <button 
                      className="action-btn-header expand"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(station.id);
                      }}
                    >
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-content-detailed">
                {/* Price Grid */}
                <div className="prices-grid-detailed">
                  <div className={`price-column ${isCheapestDiesel ? 'cheapest' : ''} ${sortBy === 'price_diesel' ? 'sorting' : ''}`}>
                    <div className="price-header">
                      <span className="fuel-type-detailed">Diesel</span>
                      {isCheapestDiesel && <span className="cheapest-badge">Cheapest</span>}
                    </div>
                    <div className="price-main">
                      <span className="price-value-detailed">€{station.diesel.toFixed(3)}</span>
                      {dieselDiff && (
                        <div className={`price-trend ${dieselDiff.isCheaper ? 'down' : 'up'}`}>
                          <FaChartLine className="trend-icon" />
                          <span className="trend-value">
                            {dieselDiff.isCheaper ? '-' : '+'}{Math.abs(dieselDiff.percentage).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={`price-column ${isCheapestE5 ? 'cheapest' : ''} ${sortBy === 'price_e5' ? 'sorting' : ''}`}>
                    <div className="price-header">
                      <span className="fuel-type-detailed">E5</span>
                      {isCheapestE5 && <span className="cheapest-badge">Cheapest</span>}
                    </div>
                    <div className="price-main">
                      <span className="price-value-detailed">€{station.e5.toFixed(3)}</span>
                      {e5Diff && (
                        <div className={`price-trend ${e5Diff.isCheaper ? 'down' : 'up'}`}>
                          <FaChartLine className="trend-icon" />
                          <span className="trend-value">
                            {e5Diff.isCheaper ? '-' : '+'}{Math.abs(e5Diff.percentage).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={`price-column ${isCheapestE10 ? 'cheapest' : ''} ${sortBy === 'price_e10' ? 'sorting' : ''}`}>
                    <div className="price-header">
                      <span className="fuel-type-detailed">E10</span>
                      {isCheapestE10 && <span className="cheapest-badge">Cheapest</span>}
                    </div>
                    <div className="price-main">
                      <span className="price-value-detailed">€{station.e10.toFixed(3)}</span>
                      {e10Diff && (
                        <div className={`price-trend ${e10Diff.isCheaper ? 'down' : 'up'}`}>
                          <FaChartLine className="trend-icon" />
                          <span className="trend-value">
                            {e10Diff.isCheaper ? '-' : '+'}{Math.abs(e10Diff.percentage).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="expanded-details">
                    <div className="details-grid">
                      {/* Services & Amenities */}
                      {station.amenities && station.amenities.length > 0 && (
                        <div className="details-section">
                          <h4 className="details-title">
                            <FaInfoCircle className="icon" />
                            Services & Amenities
                          </h4>
                          <div className="amenities-list-detailed">
                            {station.amenities.map((amenity, index) => (
                              <div key={index} className="amenity-item">
                                {getAmenityIcon(amenity)}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Services */}
                      {station.services && station.services.length > 0 && (
                        <div className="details-section">
                          <h4 className="details-title">
                            <FaCar className="icon" />
                            Additional Services
                          </h4>
                          <div className="services-list">
                            {station.services.map((service, index) => (
                              <span key={index} className="service-tag">{service}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contact Information */}
                      <div className="details-section">
                        <h4 className="details-title">
                          <FaBuilding className="icon" />
                          Contact & Hours
                        </h4>
                        <div className="contact-info">
                          {station.openingHours && (
                            <div className="contact-item">
                              <FaClock className="icon" />
                              <span>{station.openingHours}</span>
                            </div>
                          )}
                          {station.phone && (
                            <div className="contact-item">
                              <FaPhone className="icon" />
                              <span>{station.phone}</span>
                            </div>
                          )}
                          {station.website && (
                            <div className="contact-item">
                              <FaExternalLinkAlt className="icon" />
                              <a href={station.website} target="_blank" rel="noopener noreferrer">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="expanded-actions">
                      <button 
                        className="action-btn-expanded primary"
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
                        <FaDirections className="icon" />
                        Get Directions
                      </button>
                      <button 
                        className="action-btn-expanded secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`${station.name}, ${station.street} ${station.houseNumber}, ${station.place}`);
                        }}
                      >
                        <FaCopy className="icon" />
                        Copy Address
                      </button>
                      <button 
                        className="action-btn-expanded secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.share) {
                            navigator.share({
                              title: station.name,
                              text: `Check out ${station.name} - Fuel prices: Diesel €${station.diesel.toFixed(3)}, E5 €${station.e5.toFixed(3)}, E10 €${station.e10.toFixed(3)}`,
                              url: window.location.href
                            });
                          }
                        }}
                      >
                        <FaShare className="icon" />
                        Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Compact layout (default fallback)
  return (
    <div className="compact-list-view">
      {stations.map((station) => (
        <div 
          key={station.id}
          className={`compact-station-card ${selectedStation?.id === station.id ? 'selected' : ''}`}
          onClick={() => onStationSelect(station)}
        >
          <div className="compact-card-header">
            <div className="compact-station-info">
              <h4 className="compact-station-name">{station.name}</h4>
              <div className="compact-station-details">
                <span className="compact-brand">{station.brand}</span>
                <span className="compact-distance">
                  <FaRuler className="icon" />
                  {station.dist.toFixed(1)} km
                </span>
                <span className={`compact-status ${station.isOpen ? 'open' : 'closed'}`}>
                  {station.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
            {station.rating && (
              <div className="compact-rating">
                <FaStar className="icon" />
                <span>{station.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="compact-prices">
            <div className="compact-price-item">
              <span className="compact-fuel-type">D</span>
              <span className="compact-price">€{station.diesel.toFixed(3)}</span>
            </div>
            <div className="compact-price-item">
              <span className="compact-fuel-type">E5</span>
              <span className="compact-price">€{station.e5.toFixed(3)}</span>
            </div>
            <div className="compact-price-item">
              <span className="compact-fuel-type">E10</span>
              <span className="compact-price">€{station.e10.toFixed(3)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DetailedListView;