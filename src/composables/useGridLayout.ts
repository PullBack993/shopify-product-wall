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

  // Calculate how many products to display on screen (precise calculation to fill all space)
  const calculateMaxDisplayImages = (totalAvailable: number) => {
    if (typeof window === "undefined") return 40;

    // Calculate screen-based capacity for TV display
    const headerHeight = 0; // No header currently
    const brandDisplayHeight = 0; // Brand display footer height (50px logo + 20px padding + 10px buffer)
    const gridPadding = 10; // 5px top + 5px bottom from ProductGrid
    const availableHeight =
      window.innerHeight - headerHeight - brandDisplayHeight - gridPadding;

    const columns = numColumns.value;

    // Get the actual aspect ratios that will be used
    const portraitRatios = [1.0, 1.1, 1.2];
    const landscapeRatios = [1.0, 1.1, 1.2];

    // const portraitRatios = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    // const landscapeRatios = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1];
    const aspectRatios = isPortrait.value ? portraitRatios : landscapeRatios;

    // Use minimum aspect ratio for maximum height utilization (most aggressive height estimation)
    const minAspectRatio = Math.min(...aspectRatios);
    const maxItemHeight = columnWidth.value * minAspectRatio; // Use minimum ratio for maximum height

    // Calculate precise item heights (matching GridItem styling)
    const itemMargin = 4; // margin-bottom from GridItem CSS
    const totalItemHeight = maxItemHeight + itemMargin;

    // Calculate how many items fit per column (base calculation)
    const baseItemsPerColumn = Math.floor(availableHeight / totalItemHeight);

    // Calculate base screen capacity
    const baseScreenCapacity = baseItemsPerColumn * columns;

    // Calculate remaining space after base items
    const usedHeight = baseItemsPerColumn * totalItemHeight;
    const remainingHeight = availableHeight - usedHeight;

    // AGGRESSIVE BUFFER STRATEGY - Fill ALL remaining space
    let totalBufferItems = 0;

    // Strategy 1: Add full rows if possible
    const fullRowsToAdd = Math.floor(remainingHeight / totalItemHeight);
    if (fullRowsToAdd > 0) {
      totalBufferItems += fullRowsToAdd * columns;
    }

    // Strategy 2: Add individual items for remaining space
    const remainingAfterFullRows =
      remainingHeight - fullRowsToAdd * totalItemHeight;
    if (remainingAfterFullRows > maxItemHeight * 0.2) {
      // If we can fit at least 20% of an item height, add more items
      const additionalItems =
        Math.floor(remainingAfterFullRows / (maxItemHeight * 0.3)) * columns;
      totalBufferItems += additionalItems;
    }

    // Strategy 3: Add extra items for small remaining spaces
    if (remainingAfterFullRows > 20) {
      // If more than 20px remaining
      totalBufferItems += Math.floor(columns * 0.5); // Add half a row
    }

    const screenCapacity = baseScreenCapacity + totalBufferItems;

    // Use full screen capacity + aggressive buffer for maximum space utilization
    const displayCount = screenCapacity;

    // More generous bounds to allow filling all space
    const minDisplay = 10; // Minimum for good variety
    const maxDisplay = isPortrait.value
      ? Math.min(totalAvailable, 80) // Portrait: increased to 80 items
      : Math.min(totalAvailable, 120); // Landscape: increased to 120 items

    const finalCount = Math.max(minDisplay, Math.min(maxDisplay, displayCount));

    // Calculate actual space utilization
    const actualSpaceUsed = finalCount * totalItemHeight;
    const spaceUtilization = Math.round(
      (actualSpaceUsed / availableHeight) * 100
    );

    console.log(
      `📺 AGGRESSIVE SPACE FILLING (${
        isPortrait.value ? "PORTRAIT" : "LANDSCAPE"
      }):`
    );
    console.log(`   • Screen: ${window.innerWidth}x${window.innerHeight}px`);
    console.log(`   • Available height: ${availableHeight}px`);
    console.log(`   • Min aspect ratio: ${minAspectRatio.toFixed(2)}`);
    console.log(`   • Max item height: ${maxItemHeight.toFixed(1)}px`);
    console.log(`   • Item + margin: ${totalItemHeight.toFixed(1)}px`);
    console.log(`   • Base items per column: ${baseItemsPerColumn}`);
    console.log(`   • Base capacity: ${baseScreenCapacity} items`);
    console.log(`   • Remaining height: ${remainingHeight.toFixed(1)}px`);
    console.log(`   • Full rows to add: ${fullRowsToAdd}`);
    console.log(`   • Total buffer items: ${totalBufferItems}`);
    console.log(`   • Total screen capacity: ${screenCapacity} items`);
    console.log(`   • Final display count: ${finalCount} items`);
    console.log(`   • Actual space used: ${actualSpaceUsed.toFixed(1)}px`);
    console.log(`   • Space utilization: ${spaceUtilization}%`);
    console.log(
      `   • Remaining gap: ${Math.max(
        0,
        availableHeight - actualSpaceUsed
      ).toFixed(1)}px`
    );

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