import React from 'react';

interface PriceDisplayProps {
  fuelType: string;
  price: number;
  isBestPrice: boolean;
  isOverallBest: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  fuelType,
  price,
  isBestPrice,
  isOverallBest
}) => {
  return (
    <div className={`price-display ${isBestPrice ? 'best-price' : ''} ${isOverallBest ? 'overall-best' : ''}`}>
      <span className="fuel-type">{fuelType}</span>
      <span className="fuel-price">€{price.toFixed(3)}</span>
      {isBestPrice && (
        <span className="best-price-badge">Best Price</span>
      )}
      {isOverallBest && (
        <span className="overall-best-badge">Overall Best</span>
      )}
    </div>
  );
};

export default PriceDisplay;