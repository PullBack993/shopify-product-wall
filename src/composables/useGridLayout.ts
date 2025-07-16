import { ref, computed } from 'vue'

export function useGridLayout() {
  // Orientation-aware column width and gap settings
  const isPortrait = computed(() => {
    if (typeof window === "undefined") return false;
    return window.innerHeight > window.innerWidth;
  });

  // Dynamic column width based on orientation
  const columnWidth = computed(() => {
    if (isPortrait.value) {
      // Portrait mode: Use smaller columns to fit more horizontally
      return 300; // Smaller width for portrait screens
    } else {
      // Landscape mode: Use wider columns
      return 300; // Standard width for landscape screens
    }
  });

  // Dynamic gap based on orientation
  const gap = computed(() => {
    if (isPortrait.value) {
      // Portrait mode: Use smaller gaps to maximize space
      return 6; // Smaller gap for portrait screens
    } else {
      // Landscape mode: Use standard gaps
      return 8; // Standard gap for landscape screens
    }
  });

  // Calculate number of columns based on screen width and orientation
  const numColumns = computed(() => {
    if (typeof window === "undefined") return 3;

    // Use actual padding from ProductGrid component (30px on each side)
    const actualPadding = 60; // 30px left + 30px right from ProductGrid
    const availableWidth = window.innerWidth - actualPadding;

    // Orientation-specific column limits
    const minColumns = isPortrait.value ? 3 : 1; // Allow fewer columns in portrait if needed
    const maxColumns = isPortrait.value ? 8 : 4; // Allow more columns in portrait mode

    // Calculate columns that will fit in available space
    const totalColumnWidth = columnWidth.value + gap.value;
    const calculatedColumns = Math.floor(availableWidth / totalColumnWidth);

    // Use the calculated columns without conservative reductions
    const finalColumns = Math.max(
      minColumns,
      Math.min(maxColumns, calculatedColumns)
    );

    return finalColumns;
  });

  // Calculate how many products to display on screen (conservative calculation for visible items only)
  const calculateMaxDisplayImages = (totalAvailable: number) => {
    if (typeof window === "undefined") return 40;

    // Calculate screen-based capacity for TV display
    const headerHeight = 0; // No header currently
    const brandDisplayHeight = 0; // Brand display footer height
    const gridPadding = 20; // More conservative - account for real padding
    const availableHeight =
      window.innerHeight - headerHeight - brandDisplayHeight - gridPadding;

    const columns = numColumns.value;

    // Get the actual aspect ratios that will be used (matching the real product generation)
    const portraitRatios = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const landscapeRatios = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1];
    const aspectRatios = isPortrait.value ? portraitRatios : landscapeRatios;

    // Use LARGER aspect ratio for more conservative height estimation (taller items)
    const largerAspectRatio =
      aspectRatios[Math.floor(aspectRatios.length * 0.75)]; // Use 75th percentile
    const conservativeItemHeight = columnWidth.value * largerAspectRatio;

    // Calculate precise item heights with more conservative margins
    const itemMargin = 6; // More conservative margin estimate
    const totalItemHeight = conservativeItemHeight + itemMargin;

    // Calculate how many items fit per column (very conservative)
    const itemsPerColumn = Math.floor(availableHeight / totalItemHeight);

    // Calculate CONSERVATIVE screen capacity (only what actually fits)
    const screenCapacity = itemsPerColumn * columns;

    // Apply AGGRESSIVE safety margin to ensure all items are visible (reduce by 40%)
    const safetyMargin = 0.6; // Show only 60% of calculated capacity for safety
    const safeCapacity = Math.floor(screenCapacity * safetyMargin);

    // Very conservative bounds
    const minDisplay = 6; // Minimum for good variety
    const maxDisplay = isPortrait.value
      ? Math.min(totalAvailable, 12) // Portrait: max 12 items
      : Math.min(totalAvailable, 15); // Landscape: max 15 items

    const finalCount = Math.max(minDisplay, Math.min(maxDisplay, safeCapacity));

    return finalCount;
  };

  // Handle window resize and orientation changes
  const handleResize = () => {
    // Force recalculation of all computed properties
    // This will trigger when orientation changes
  };

  return {
    columnWidth,
    gap,
    numColumns,
    isPortrait,
    calculateMaxDisplayImages,
    handleResize,
  };
} 