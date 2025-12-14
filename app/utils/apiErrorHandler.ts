// utils/apiErrorHandler.ts
export class GasStationAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GasStationAPIError';
  }
}

export const handleGasStationAPIError = (error: unknown): GasStationAPIError => {
  if (error instanceof GasStationAPIError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('API key')) {
      return new GasStationAPIError(
        'Invalid API key. Please check your configuration.',
        'INVALID_API_KEY'
      );
    }
    
    if (error.message.includes('Radius cannot exceed')) {
      return new GasStationAPIError(
        'Search radius is too large. Maximum is 25 km.',
        'RADIUS_TOO_LARGE'
      );
    }
    
    if (error.message.includes('timeout')) {
      return new GasStationAPIError(
        'Request timed out. Please check your internet connection.',
        'TIMEOUT'
      );
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      return new GasStationAPIError(
        'Unable to connect to the server. Please try again later.',
        'CONNECTION_ERROR'
      );
    }
  }

  return new GasStationAPIError(
    'An unexpected error occurred. Please try again.',
    'UNKNOWN_ERROR'
  );
};