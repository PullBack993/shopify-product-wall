import { ref, computed } from 'vue'

export function useGridLayout() {
  const columnWidth = ref(300); // Optimized column width
  const gap = ref(8); // Minimal gap for maximum space usage

  // Calculate number of columns based on screen width for portrait TV
  const numColumns = computed(() => {
    if (typeof window === "undefined") return 3;

    // Use actual padding from ProductGrid component (30px on each side)
    const actualPadding = 60; // 30px left + 30px right from ProductGrid
    const availableWidth = window.innerWidth - actualPadding;

    const minColumns = 3; // Minimum for portrait TV
    const maxColumns = 10; // Allow more columns for full space usage

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

    console.log(`📏 GRID LAYOUT:`);
    console.log(`   • Screen width: ${window.innerWidth}px`);
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
    const avgImageHeight = columnWidth.value * 1.0; // Estimate based on avg aspect ratio
    const imageWithGap = avgImageHeight + gap.value;
    const imagesPerColumn = Math.floor(availableHeight / imageWithGap);
    const screenCapacity = imagesPerColumn * columns;

    // Use 100% of screen capacity for maximum space utilization
    const displayCount = Math.floor(screenCapacity * 1.0); // Changed from 0.7 to 1.0

    // Set reasonable bounds for TV display
    const minDisplay = 5; // Minimum for good variety
    const maxDisplay = Math.min(totalAvailable, 60); // Allow more items, up to 60 or total available

    const finalCount = Math.max(minDisplay, Math.min(maxDisplay, displayCount));

    console.log(`📺 TV DISPLAY CALCULATION:`);
    console.log(`   • Screen: ${window.innerWidth}x${window.innerHeight}px`);
    console.log(`   • Available height: ${availableHeight}px`);
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

  // Handle window resize
  const handleResize = () => {
    // Trigger reactivity for numColumns
    columnWidth.value = columnWidth.value;
  };

  return {
    columnWidth,
    gap,
    numColumns,
    calculateMaxDisplayImages,
    handleResize,
  };
} 