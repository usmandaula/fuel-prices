import React from 'react';
import { FaRuler } from 'react-icons/fa';

interface RadiusSelectorProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
  options?: number[];
  className?: string;
}

const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  radius,
  onRadiusChange,
  options = [1, 3, 5, 10, 15, 25],
  className = ''
}) => {
  console.log('🎯 RadiusSelector rendered, radius:', radius);

  const handleClick = (r: number, event: React.MouseEvent) => {
    console.log('🎯 CLICK REGISTERED:', {
      clickedRadius: r,
      currentRadius: radius,
      eventType: event.type,
      timestamp: Date.now()
    });
    
    event.preventDefault(); // Prevent any default behavior
    event.stopPropagation(); // Stop bubbling
    
    if (onRadiusChange) {
      console.log('🎯 Calling onRadiusChange with:', r);
      onRadiusChange(r);
    } else {
      console.error('❌ onRadiusChange is undefined!');
    }
  };

  return (
    <div className={`radius-selector ${className}`}>
      <div className="radius-header">
        <FaRuler className="radius-icon" />
        <span className="radius-label">Radius</span>
        <span className="current-radius">{radius}km</span>
      </div>
      
      <div className="radius-buttons">
        {options.map((r) => (
          <button
            key={r}
            className={`radius-btn ${radius === r ? 'active' : ''}`}
            onClick={(e) => handleClick(r, e)}
            title={`Search within ${r} kilometers`}
          >
            {r}
            <span className="unit">km</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RadiusSelector;