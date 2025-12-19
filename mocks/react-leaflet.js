import React from 'react';

// Mock all react-leaflet components
export const MapContainer = ({ children, center, zoom, style, ref, className }) => {
  return React.createElement('div', {
    'data-testid': 'map-container',
    className,
    ref,
    style,
    'data-center': JSON.stringify(center),
    'data-zoom': zoom
  }, children);
};

export const TileLayer = ({ url, attribution }) => {
  return React.createElement('div', {
    'data-testid': 'tile-layer',
    'data-url': url,
    'data-attribution': attribution
  });
};

export const Marker = ({ position, icon, children, eventHandlers }) => {
  const onClick = (e) => {
    if (eventHandlers?.click) {
      const mockEvent = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        target: { closest: () => null }
      };
      eventHandlers.click(mockEvent);
    }
  };
  
  return React.createElement('div', {
    'data-testid': 'marker',
    'data-position': JSON.stringify(position),
    onClick
  }, children);
};

export const Popup = ({ children }) => {
  return React.createElement('div', {
    'data-testid': 'popup'
  }, children);
};

export const Circle = ({ center, radius, pathOptions }) => {
  return React.createElement('div', {
    'data-testid': 'circle',
    'data-center': JSON.stringify(center),
    'data-radius': radius
  });
};

export const ZoomControl = ({ position }) => {
  return React.createElement('div', {
    'data-testid': 'zoom-control',
    'data-position': position
  });
};

export const ScaleControl = ({ position, imperial }) => {
  return React.createElement('div', {
    'data-testid': 'scale-control',
    'data-position': position,
    'data-imperial': imperial
  });
};

export const LayersControl = ({ children, position }) => {
  return React.createElement('div', {
    'data-testid': 'layers-control',
    'data-position': position
  }, children);
};

export const BaseLayer = ({ children, checked, name }) => {
  return React.createElement('div', {
    'data-testid': 'base-layer',
    'data-checked': checked,
    'data-name': name
  }, children);
};

export const useMap = () => ({
  setView: jest.fn(),
  flyTo: jest.fn(),
  getZoom: jest.fn(() => 13),
  on: jest.fn(),
  removeLayer: jest.fn(),
  addLayer: jest.fn(),
  latLngToContainerPoint: jest.fn(() => ({ x: 0, y: 0 })),
  containerPointToLatLng: jest.fn(() => [52.52, 13.405]),
  getBounds: jest.fn(() => ({
    getSouthWest: jest.fn(() => ({ lat: 52.51, lng: 13.39 })),
    getNorthEast: jest.fn(() => ({ lat: 52.53, lng: 13.42 }))
  }))
});

export const useMapEvents = (handlers) => {
  // Simulate map events
  React.useEffect(() => {
    Object.entries(handlers).forEach(([event, handler]) => {
      if (typeof handler === 'function') {
        // Simulate initial call for certain events
        if (event === 'zoomend') {
          setTimeout(() => handler(), 0);
        }
      }
    });
  }, [handlers]);
  
  return {
    getZoom: () => 13,
    flyTo: jest.fn(),
    setView: jest.fn()
  };
};

// Mock for LayersControl
export const LayersControl = ({ children, position }) => {
  return React.createElement('div', {
    'data-testid': 'layers-control',
    'data-position': position
  }, children);
};

LayersControl.BaseLayer = BaseLayer;

// Default export for compatibility
export default {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  ZoomControl,
  ScaleControl,
  LayersControl,
  useMap,
  useMapEvents
};