import React from 'react';

const MapLegend: React.FC = () => {
  return (
    <div className="map-legend">
      <div className="legend-title">Map Legend</div>
      <div className="legend-items">
        <div className="legend-item">
          <div className="legend-color open"></div>
          <span>Open Station</span>
        </div>
        <div className="legend-item">
          <div className="legend-color closed"></div>
          <span>Closed Station</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-color user"></div>
          <span>Your Location</span>
        </div>
        <div className="legend-item">
          <div className="legend-color searched"></div>
          <span>Search Location</span>
        </div>
        <div className="legend-item">
          <div className="legend-color best-fuel"></div>
          <span>Best Fuel Price</span>
        </div>
        <div className="legend-item">
          <div className="legend-color best-overall"></div>
          <span>Best Overall Price</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;