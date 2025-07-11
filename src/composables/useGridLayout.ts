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
      return 220; // Smaller width for portrait screens
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
    const minColumns = isPortrait.value ? 2 : 3; // Allow fewer columns in portrait if needed
    const maxColumns = isPortrait.value ? 8 : 6; // Allow more columns in portrait mode

    // Calculate columns that will fit in available space
    const totalColumnWidth = columnWidth.value + gap.value;
    const calculatedColumns = Math.floor(availableWidth / totalColumnWidth);

    // Use the calculated columns without conservative reductions
    const finalColumns = Math.max(
      minColumns,
      Math.min(maxColumns, calculatedColumns)
    );

    // Verify the total width fits (with proper spacing)
    const actualTotalWidth =
      finalColumns * columnWidth.value + (finalColumns - 1) * gap.value;

    console.log(
      `📏 GRID LAYOUT (${isPortrait.value ? "PORTRAIT" : "LANDSCAPE"}):`
    );
    console.log(`   • Screen: ${window.innerWidth}x${window.innerHeight}px`);
    console.log(`   • Column width: ${columnWidth.value}px`);
    console.log(`   • Gap: ${gap.value}px`);
    console.log(`   • Available width: ${availableWidth}px`);
    console.log(`   • Calculated columns: ${finalColumns}`);
    console.log(`   • Total content width: ${actualTotalWidth}px`);
    console.log(
      `   • Space utilization: ${Math.round(
        (actualTotalWidth / availableWidth) * 100
      )}%`
    );

    return finalColumns;
  });

  // Calculate how many products to display on screen (use full vertical space)
  const calculateMaxDisplayImages = (totalAvailable: number) => {
    if (typeof window === "undefined") return 40;

    // Calculate screen-based capacity for TV display
    const headerHeight = 0; // No header currently
    const brandDisplayHeight = 0; // Brand display footer height (padding + logo + text)
    const gridPadding = 10; // 5px top + 5px bottom from ProductGrid
    const availableHeight =
      window.innerHeight - headerHeight - brandDisplayHeight - gridPadding;

    const columns = numColumns.value;

    // Orientation-aware image height calculation
    const aspectRatioMultiplier = isPortrait.value ? 1.1 : 1.0; // Slightly taller in portrait
    const avgImageHeight = columnWidth.value * aspectRatioMultiplier;
    const imageWithGap = avgImageHeight + gap.value;
    const imagesPerColumn = Math.floor(availableHeight / imageWithGap);
    const screenCapacity = imagesPerColumn * columns;

    // Use 100% of screen capacity for maximum space utilization
    const displayCount = Math.floor(screenCapacity * 1.0);

    // Orientation-specific bounds
    const minDisplay = 5; // Minimum for good variety
    const maxDisplay = isPortrait.value
      ? Math.min(totalAvailable, 40) // Portrait: up to 40 items
      : Math.min(totalAvailable, 60); // Landscape: up to 60 items

    const finalCount = Math.max(minDisplay, Math.min(maxDisplay, displayCount));

    console.log(
      `📺 TV DISPLAY CALCULATION (${
        isPortrait.value ? "PORTRAIT" : "LANDSCAPE"
      }):`
    );
    console.log(`   • Screen: ${window.innerWidth}x${window.innerHeight}px`);
    console.log(`   • Available height: ${availableHeight}px`);
    console.log(`   • Avg image height: ${avgImageHeight}px`);
    console.log(`   • Images per column: ${imagesPerColumn}`);
    console.log(`   • Screen capacity: ${screenCapacity} products`);
    console.log(
      `   • Display count: ${finalCount} products (${Math.round(
        (finalCount / totalAvailable) * 100
      )}%)`
    );
    console.log(`   • Rotation queue: ${totalAvailable - finalCount} products`);

    return finalCount;
  };

  // Handle window resize and orientation changes
  const handleResize = () => {
    // Force recalculation of all computed properties
    // This will trigger when orientation changes
    console.log(
      `🔄 Window resized/rotated: ${window.innerWidth}x${
        window.innerHeight
      }px (${isPortrait.value ? "PORTRAIT" : "LANDSCAPE"})`
    );
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