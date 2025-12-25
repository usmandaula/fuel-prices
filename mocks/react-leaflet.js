// __mocks__/react-leaflet.js
const React = require('react');

const MockComponent = (props) => {
  const testId = props['data-testid'] || 'mock-component';
  return React.createElement('div', { 'data-testid': testId, onClick: props.onClick }, props.children);
};

const MapContainer = (props) => React.createElement(MockComponent, { 'data-testid': 'map-container', ...props });
const TileLayer = (props) => React.createElement(MockComponent, { 'data-testid': 'tile-layer', ...props });
const Marker = (props) => React.createElement(MockComponent, { 'data-testid': 'marker', ...props });
const Popup = (props) => React.createElement(MockComponent, { 'data-testid': 'popup', ...props });
const Circle = (props) => React.createElement(MockComponent, { 'data-testid': 'circle', ...props });
const ZoomControl = (props) => React.createElement(MockComponent, { 'data-testid': 'zoom-control', ...props });
const ScaleControl = (props) => React.createElement(MockComponent, { 'data-testid': 'scale-control', ...props });
const BaseLayer = (props) => React.createElement(MockComponent, { 'data-testid': 'base-layer', ...props });
const LayersControl = (props) => React.createElement(MockComponent, { 'data-testid': 'layers-control', ...props });
LayersControl.BaseLayer = BaseLayer;

const useMap = () => ({
  setView: jest.fn(),
  flyTo: jest.fn(),
  getZoom: () => 13,
});
const useMapEvents = () => ({ getZoom: () => 13 });

module.exports = {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  ZoomControl,
  ScaleControl,
  LayersControl,
  useMap,
  useMapEvents,
};
