import os
from pathlib import Path

# Updated structure based on the new requirements
paths = [
    # layouts directory
    "src/layouts/MapViewLayout.tsx",
    "src/layouts/ListViewLayout.tsx",
    "src/layouts/Navbar.tsx",
    "src/layouts/Footer.tsx",
    
    # ui directory
    "src/ui/SelectedStationOverlay.tsx",
    "src/ui/PriceDisplay.tsx",
    "src/ui/MapLegend.tsx",
    "src/ui/EmptyState.tsx",
    "src/ui/RadiusSelector.tsx",
    
    # utils directory (updated)
    "src/utils/distanceCalculator.ts",
    
    # Original structure kept for reference/compatibility
    # components directory
    "src/components/EnhancedSearch.tsx",
    "src/components/StationCard.tsx",
    "src/components/MapControls.tsx",
    "src/components/ClickableStats.tsx",
    "src/components/ListViewSidebar.tsx",
    "src/components/MapViewSidebar.tsx",
    "src/components/DarkModeToggle.tsx",
    "src/components/index.ts",  # barrel export
    
    # types directory
    "src/types/gasStationTypes.ts",
    
    # Additional utils (kept from original)
    "src/utils/gasStationUtils.ts",
    
    # root level components
    "src/DetailedMapView.tsx",
    "src/GasStationsList.tsx",  # main component
    
    # Optional: Create barrel exports for new directories
    "src/layouts/index.ts",
    "src/ui/index.ts",
    "src/utils/index.ts",
]

for path in paths:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'a'):
        pass  # Create empty file
    print(f"Created: {path}")