const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  moduleNameMapper: {
    '^react-leaflet$': '<rootDir>/mocks/react-leaflet.js',
    '^leaflet$': '<rootDir>/mocks/leaflet.js',
    '^leaflet/dist/leaflet.css$': '<rootDir>/mocks/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg)$': '<rootDir>/mocks/fileMock.js',
  },
  
  testMatch: [
    '<rootDir>/app/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  
  transformIgnorePatterns: [
    '/node_modules/(?!react-leaflet|leaflet)',
  ],
  
  // Handle module loading
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // Reset mocks between tests
  resetMocks: true,
  clearMocks: true,
  
  // Show more useful output
  verbose: true,
};

module.exports = createJestConfig(config);