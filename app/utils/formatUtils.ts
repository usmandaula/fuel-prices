/**
 * Formats a price value safely
 * @param price - The price to format
 * @returns Formatted price string (e.g., "€1.549" or "N/A")
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A';
  }
  return `€${price.toFixed(3)}`;
};

/**
 * Formats a distance value safely
 * @param distance - The distance in kilometers
 * @returns Formatted distance string (e.g., "1.5 km" or "N/A")
 */
export const formatDistance = (distance: number | null | undefined): string => {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return 'N/A';
  }
  return `${distance.toFixed(1)} km`;
};

/**
 * Formats a number with specified decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return value.toFixed(decimals);
};

/**
 * Checks if a price is valid (not null/undefined and realistic)
 * @param price - The price to check
 * @returns boolean indicating if price is valid
 */
export const isValidPrice = (price: number | null | undefined): boolean => {
  return price !== null && price !== undefined && !isNaN(price) && price > 0;
};

/**
 * Gets the cheapest fuel type from a station
 * @param station - The gas station object
 * @returns Object with type and price of cheapest fuel
 */
export const getCheapestFuel = (station: any): { type: string; price: number } => {
  if (!station) return { type: 'none', price: 0 };
  
  const fuels = [
    { type: 'diesel', price: station.diesel },
    { type: 'e5', price: station.e5 },
    { type: 'e10', price: station.e10 }
  ].filter(fuel => isValidPrice(fuel.price));
  
  if (fuels.length === 0) return { type: 'none', price: 0 };
  
  return fuels.reduce((cheapest, fuel) => 
    fuel.price < cheapest.price ? fuel : cheapest
  );
};