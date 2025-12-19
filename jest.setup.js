import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Fix for TextEncoder/Decoder in Jest
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// Mock environment variables
process.env.NEXT_PUBLIC_TANKERKOENIG_API_KEY = 'test-api-key-12345-67890-12345-67890';
process.env.NEXT_PUBLIC_DEFAULT_LAT = '52.521';
process.env.NEXT_PUBLIC_DEFAULT_LNG = '13.438';
process.env.NEXT_PUBLIC_DEFAULT_RADIUS = '5';
// Mock window properties
global.window = Object.create(window);

// Mock URL.createObjectURL if needed
global.URL.createObjectURL = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) => {
    if (success) {
      success({
        coords: {
          latitude: 52.52,
          longitude: 13.405,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });
    }
  }),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};
Object.defineProperty(window.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
    readText: jest.fn(),
  },
});

// Mock share API
Object.assign(navigator, {
  share: jest.fn().mockImplementation(() => Promise.resolve()),
});

// Mock leaflet global
global.L = require('./mocks/leaflet').default || require('./mocks/leaflet');

// Mock window properties for leaflet
Object.defineProperty(window, 'L', {
  value: global.L,
  writable: true,
});

// Mock for CSS imports
jest.mock('./app/globals.css', () => ({}));
jest.mock('leaflet/dist/leaflet.css', () => ({}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});