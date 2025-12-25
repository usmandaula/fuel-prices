// Simple leaflet mock
const L = {
  Icon: {
    Default: {
      mergeOptions: jest.fn(),
      prototype: {}
    }
  },
  divIcon: jest.fn(() => ({ 
    options: {},
    createIcon: () => document.createElement('div')
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    setLatLng: jest.fn().mockReturnThis(),
    getLatLng: jest.fn(() => ({ lat: 52.52, lng: 13.405 }))
  })),
  latLngBounds: jest.fn(() => ({
    pad: jest.fn().mockReturnThis(),
    getCenter: jest.fn(() => ({ lat: 52.52, lng: 13.405 })),
    extend: jest.fn().mockReturnThis(),
    getSouthWest: jest.fn(() => ({ lat: 52.51, lng: 13.39 })),
    getNorthEast: jest.fn(() => ({ lat: 52.53, lng: 13.42 }))
  })),
  map: jest.fn(() => ({
    setView: jest.fn(),
    flyTo: jest.fn(),
    getZoom: jest.fn(() => 13),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    removeLayer: jest.fn(),
    addLayer: jest.fn(),
    fitBounds: jest.fn(),
    latLngToContainerPoint: jest.fn(() => ({ x: 0, y: 0 })),
    containerPointToLatLng: jest.fn(() => [52.52, 13.405])
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  circle: jest.fn(() => ({
    addTo: jest.fn(),
    setLatLng: jest.fn().mockReturnThis(),
    setRadius: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis()
  })),
  control: {
    layers: jest.fn(() => ({
      addTo: jest.fn(),
      addBaseLayer: jest.fn()
    })),
    zoom: jest.fn(() => ({
      addTo: jest.fn(),
      setPosition: jest.fn()
    })),
    scale: jest.fn(() => ({
      addTo: jest.fn(),
      setPosition: jest.fn()
    }))
  },
  DomUtil: {
    create: jest.fn(() => document.createElement('div'))
  },
  DomEvent: {
    on: jest.fn(),
    off: jest.fn()
  }
};

// Fix for leaflet icon issue
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '',
    iconUrl: '',
    shadowUrl: ''
  });
}

module.exports = L;