import { useState, useCallback, useEffect } from 'react';

export const useLocation = (initialUserLocation: any, onLocationSearch?: (location: any) => void) => {
  const [userLocation, setUserLocation] = useState<any>(initialUserLocation);
  const [searchedLocation, setSearchedLocation] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location'
        };
        setUserLocation(location);
        setSearchedLocation(null);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleLocationFound = useCallback((location: { lat: number; lng: number; name: string }) => {
    setSearchedLocation(location);
    setUserLocation(location);
    
    if (onLocationSearch) {
      onLocationSearch(location);
    }
  }, [onLocationSearch]);

  useEffect(() => {
    if (!initialUserLocation && !searchedLocation) {
      getUserLocation();
    }
  }, [getUserLocation, initialUserLocation, searchedLocation]);

  return {
    userLocation,
    searchedLocation,
    isLocating,
    handleLocationFound,
    getUserLocation
  };
};