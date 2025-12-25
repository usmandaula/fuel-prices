import { GasStationAPIError, handleGasStationAPIError } from './apiErrorHandler';

describe('apiErrorHandler', () => {
  describe('GasStationAPIError', () => {
    test('creates error with message', () => {
      const error = new GasStationAPIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('GasStationAPIError');
    });

    test('creates error with code and status', () => {
      const error = new GasStationAPIError('Test error', 'TEST_CODE', 400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('handleGasStationAPIError', () => {
    test('returns existing GasStationAPIError unchanged', () => {
      const originalError = new GasStationAPIError('Original error', 'ORIGINAL_CODE', 500);
      const result = handleGasStationAPIError(originalError);
      expect(result).toBe(originalError);
      expect(result.message).toBe('Original error');
      expect(result.code).toBe('ORIGINAL_CODE');
    });

    test('handles API key errors', () => {
      const error = new Error('Invalid API key');
      const result = handleGasStationAPIError(error);
      expect(result.message).toBe('Invalid API key. Please check your configuration.');
      expect(result.code).toBe('INVALID_API_KEY');
    });

    test('handles radius too large errors', () => {
      const error = new Error('Radius cannot exceed');
      const result = handleGasStationAPIError(error);
      expect(result.message).toBe('Search radius is too large. Maximum is 25 km.');
      expect(result.code).toBe('RADIUS_TOO_LARGE');
    });

    test('handles timeout errors', () => {
      // Test different timeout error messages
      const error1 = new Error('timeout');
      const result1 = handleGasStationAPIError(error1);
      expect(result1.message).toBe('Request timed out. Please check your internet connection.');
      expect(result1.code).toBe('TIMEOUT');

      const error2 = new Error('Request timeout');
      const result2 = handleGasStationAPIError(error2);
      expect(result2.message).toBe('Request timed out. Please check your internet connection.');
      expect(result2.code).toBe('TIMEOUT');

      const error3 = new Error('The operation timed out');
      const result3 = handleGasStationAPIError(error3);
      expect(result3.message).toBe('Request timed out. Please check your internet connection.');
      expect(result3.code).toBe('TIMEOUT');
    });

    test('handles connection errors', () => {
      const error = new Error('ECONNREFUSED');
      const result = handleGasStationAPIError(error);
      expect(result.message).toBe('Unable to connect to the server. Please try again later.');
      expect(result.code).toBe('CONNECTION_ERROR');
    });

    test('handles unknown errors', () => {
      const error = new Error('Some unknown error');
      const result = handleGasStationAPIError(error);
      expect(result.message).toBe('An unexpected error occurred. Please try again.');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('handles non-Error objects', () => {
      const error = 'String error';
      const result = handleGasStationAPIError(error);
      expect(result.message).toBe('An unexpected error occurred. Please try again.');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('handles null/undefined errors', () => {
      const result1 = handleGasStationAPIError(null);
      const result2 = handleGasStationAPIError(undefined);
      
      expect(result1.message).toBe('An unexpected error occurred. Please try again.');
      expect(result2.message).toBe('An unexpected error occurred. Please try again.');
      expect(result1.code).toBe('UNKNOWN_ERROR');
      expect(result2.code).toBe('UNKNOWN_ERROR');
    });

    test('handles network errors', () => {
      const error = new Error('Network Error');
      const result = handleGasStationAPIError(error);
      expect(result.message).toBe('Unable to connect to the server. Please try again later.');
      expect(result.code).toBe('CONNECTION_ERROR');
    });

    test('handles fetch errors', () => {
      const error = new Error('Failed to fetch');
      const result = handleGasStationAPIError(error);
      expect(result.message).toBe('Unable to connect to the server. Please try again later.');
      expect(result.code).toBe('CONNECTION_ERROR');
    });
  });
});