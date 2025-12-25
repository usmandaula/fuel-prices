// MapLegend.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import MapLegend from './MapLegend';

describe('MapLegend', () => {
  test('renders map legend with title', () => {
    render(<MapLegend />);
    
    expect(screen.getByText('Map Legend')).toBeInTheDocument();
  });

  test('renders all legend items', () => {
    render(<MapLegend />);
    
    // Check all legend items
    expect(screen.getByText('Open Station')).toBeInTheDocument();
    expect(screen.getByText('Closed Station')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Your Location')).toBeInTheDocument();
    expect(screen.getByText('Search Location')).toBeInTheDocument();
  });

  test('renders correct legend colors', () => {
    const { container } = render(<MapLegend />);
    
    const legendItems = container.querySelectorAll('.legend-item');
    expect(legendItems).toHaveLength(5);
    
    // Check each has a color element
    legendItems.forEach(item => {
      const colorElement = item.querySelector('.legend-color');
      expect(colorElement).toBeInTheDocument();
    });
    
    // Check specific color classes
    const colors = container.querySelectorAll('.legend-color');
    expect(colors[0]).toHaveClass('open');
    expect(colors[1]).toHaveClass('closed');
    expect(colors[2]).toHaveClass('selected');
    expect(colors[3]).toHaveClass('user');
    expect(colors[4]).toHaveClass('searched');
  });

  test('has correct CSS classes', () => {
    const { container } = render(<MapLegend />);
    
    const legend = container.querySelector('.map-legend');
    expect(legend).toBeInTheDocument();
    
    const title = container.querySelector('.legend-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Map Legend');
    
    const itemsContainer = container.querySelector('.legend-items');
    expect(itemsContainer).toBeInTheDocument();
  });
});