import os
from pathlib import Path

# Updated structure based on the new requirements
paths = [
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
    
    # utils directory
    "src/utils/gasStationUtils.ts",
    
    # root level components
    "src/DetailedMapView.tsx",
    "src/GasStationsList.tsx",  # main component
    
    # Original components that might still be needed for reference or compatibility
    # (keeping these but commented out - uncomment if you want to keep them)
    # "src/components/UI/Button/index.tsx",
    # "src/components/UI/Button/Button.tsx",
    # "src/components/UI/Button/styles.css",
    # "src/components/UI/Card/index.tsx",
    # "src/components/UI/Card/Card.tsx",
    # "src/components/UI/Card/styles.css",
    # "src/components/UI/Icon/index.tsx",
    # "src/components/UI/Icon/Icon.tsx",
    # "src/components/UI/Icon/styles.css",
    # "src/hooks/useGeolocation.ts",
    # "src/hooks/useStationSorting.ts",
    # "src/utils/distance.ts",
    # "src/utils/sorting.ts",
    # "src/utils/geocoding.ts",
]

for path in paths:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'a'):
        pass  # Create empty file
    print(f"Created: {path}")


