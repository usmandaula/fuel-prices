import React from 'react';
import { FaLayerGroup, FaEye, FaCompass, FaCar, FaLocationArrow } from 'react-icons/fa';
import { MapLayer } from '../types/gasStationTypes';

interface MapControlsProps {
  onLayerChange: (layer: MapLayer) => void;
  onToggleTraffic: () => void;
  onRecenter: () => void;
  activeLayer: MapLayer;
  showTraffic: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  onLayerChange,
  onToggleTraffic,
  onRecenter,
  activeLayer,
  showTraffic
}) => {
  return (
    <div className="map-controls">
      <div className="controls-group">
        <button 
          className={`control-btn ${activeLayer === 'standard' ? 'active' : ''}`}
          onClick={() => onLayerChange('standard')}
          title="Standard Map"
        >
          <FaLayerGroup />
        </button>
        <button 
          className={`control-btn ${activeLayer === 'satellite' ? 'active' : ''}`}
          onClick={() => onLayerChange('satellite')}
          title="Satellite View"
        >
          <FaEye />
        </button>
        <button 
          className={`control-btn ${activeLayer === 'terrain' ? 'active' : ''}`}
          onClick={() => onLayerChange('terrain')}
          title="Terrain View"
        >
          <FaCompass />
        </button>
      </div>
      
      <div className="controls-group">
        <button 
          className={`control-btn ${showTraffic ? 'active' : ''}`}
          onClick={onToggleTraffic}
          title="Show Traffic"
        >
          <FaCar />
        </button>
        <button 
          className="control-btn"
          onClick={onRecenter}
          title="Recenter Map"
        >
          <FaLocationArrow />
        </button>
      </div>
    </div>
  );
};

export default MapControls;