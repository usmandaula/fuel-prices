export interface GasStation {
  id: string;
  name: string;
  brand: string;
  street: string;
  place: string;
  lat: number;
  lng: number;
  dist: number;
  diesel: number;
  e5: number;
  e10: number;
  isOpen: boolean;
  houseNumber: string;
  postCode: number;
  rating?: number;
  amenities?: string[];
  isBestForSelectedFuel?: boolean;
  isOverallBestPrice?: boolean;
  minPrice?: number;
}

export interface GasStationData {
  ok: boolean;
  license: string;
  data: string;
  status: string;
  stations: GasStation[];
}



export interface BestPriceInfo {
  price: number;
  stationId: string;
  stationName: string;
  type: FuelType;
}

export type SortOption = 'distance' | 'price_diesel' | 'price_e5' | 'price_e10' | 'name' | 'rating' | 'best_price';
export type SortDirection = 'low_to_high' | 'high_to_low';
export type MapLayer = 'standard' | 'satellite' | 'terrain';
export type FuelType = 'diesel' | 'e5' | 'e10';

export interface ListViewSidebarProps {
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  setPriceFilter: (filter: 'all' | 'diesel' | 'e5' | 'e10') => void;
  openStationsCount: number;
  sortedStationsLength: number;
  averagePrice: string;
  bestPrices: {
    diesel: BestPriceInfo | null;
    e5: BestPriceInfo | null;
    e10: BestPriceInfo | null;
    overall: BestPriceInfo | null;
  };
  selectedFuelType: 'all' | 'diesel' | 'e5' | 'e10';
  onPriceClick: (stationId: string, fuelType?: FuelType) => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  isDarkMode?: boolean;
  viewMode?: 'list' | 'map';
    radius?: number;
  onRadiusChange?: (radius: number) => void;
}

export interface MapViewSidebarProps {
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  setPriceFilter: (filter: 'all' | 'diesel' | 'e5' | 'e10') => void;
  openStationsCount: number;
  sortedStationsLength: number;
  averagePrice: string;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  bestPrices: {
    diesel: BestPriceInfo | null;
    e5: BestPriceInfo | null;
    e10: BestPriceInfo | null;
    overall: BestPriceInfo | null;
  };
  selectedFuelType: 'all' | 'diesel' | 'e5' | 'e10';
  onPriceClick: (stationId: string, fuelType?: FuelType) => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  isDarkMode?: boolean;
  viewMode?: 'list' | 'map';
}

export interface ClickableStatsProps {
  bestPrices: {
    diesel: BestPriceInfo | null;
    e5: BestPriceInfo | null;
    e10: BestPriceInfo | null;
    overall: BestPriceInfo | null;
  };
  onPriceClick: (stationId: string, fuelType?: FuelType) => void;
  openStationsCount: number;
  sortedStationsLength: number;
  averagePrice: string;
  selectedFuelType: 'all' | 'diesel' | 'e5' | 'e10';
  isMapView?: boolean;
}

export interface StationCardProps {
  station: GasStation;
  isSelected: boolean;
  onSelect: (station: GasStation) => void;
  userLocation?: { lat: number; lng: number; name?: string };
  sortBy: SortOption;
  isBestForSelectedFuel?: boolean;
  isOverallBestPrice?: boolean;
  selectedFuelType?: 'all' | 'diesel' | 'e5' | 'e10';
  scrollToStation?: (stationId: string) => void;
}
export interface GasStationsListProps {
  data: GasStationData;
  initialUserLocation?: { lat: number; lng: number; name?: string };
  onLocationSearch?: (location: { lat: number; lng: number; name: string }) => void;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
}
export interface ListViewLayoutProps {
  sortedStations: GasStation[];
  selectedStation: GasStation | null;
  setSelectedStation: (station: GasStation | null) => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  setSortBy: (option: SortOption) => void;
  setSortDirection: (direction: SortDirection) => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
  priceFilter: 'all' | 'diesel' | 'e5' | 'e10';
  setPriceFilter: (filter: 'all' | 'diesel' | 'e5' | 'e10') => void;
  openStationsCount: number;
  averagePrice: string;
  bestPrices: {
    diesel: BestPriceInfo | null;
    e5: BestPriceInfo | null;
    e10: BestPriceInfo | null;
    overall: BestPriceInfo | null;
  };
  handleBestPriceClick: (stationId: string, fuelType?: FuelType) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isDarkMode: boolean;
  isLocating: boolean;
  getUserLocation: () => void;
  scrollToStation: (stationId: string) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  userLocation?: { lat: number; lng: number; name?: string };
}