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
    const errorMessage = error.message.toLowerCase();
    
    // Check for specific error messages
    if (errorMessage.includes('api key')) {
      return new GasStationAPIError(
        'Invalid API key. Please check your configuration.',
        'INVALID_API_KEY'
      );
    }
    
    if (errorMessage.includes('radius cannot exceed')) {
      return new GasStationAPIError(
        'Search radius is too large. Maximum is 25 km.',
        'RADIUS_TOO_LARGE'
      );
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return new GasStationAPIError(
        'Request timed out. Please check your internet connection.',
        'TIMEOUT'
      );
    }
    
    if (errorMessage.includes('econnrefused') || 
        errorMessage.includes('network error') ||
        errorMessage.includes('failed to fetch')) {
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