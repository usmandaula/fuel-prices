import React from 'react';
import { FaGasPump } from 'react-icons/fa';

const EmptyState: React.FC = () => {
  return (
    <div className="empty-state">
      <FaGasPump className="empty-icon" />
      <h3>No stations found</h3>
      <p>Try adjusting your filters or search location</p>
    </div>
  );
};

export default EmptyState;