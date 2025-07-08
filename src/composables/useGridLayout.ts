import { ref, computed } from 'vue'

export function useGridLayout() {
  const columnWidth = ref(300) // Optimized for no overflow
  const gap = ref(8) // Minimal gap for maximum space usage

  // Calculate number of columns based on screen width for portrait TV
  const numColumns = computed(() => {
    if (typeof window === 'undefined') return 3
    
    // Extremely conservative calculation to prevent ANY overflow
    const mainContentPadding = 60 // 30px on each side
    const extraSafetyBuffer = 80 // Large buffer to ensure zero overflow
    const availableWidth = window.innerWidth - mainContentPadding - extraSafetyBuffer
    
    const minColumns = 3 // Minimum for portrait TV
    const maxColumns = 8 // Further reduced maximum
    
    // Calculate based on available width and column size
    const totalColumnWidth = columnWidth.value + gap.value
    const calculatedColumns = Math.floor(availableWidth / totalColumnWidth)
    
    // Always subtract 1 column for absolute safety
    const ultraConservativeColumns = Math.max(minColumns, Math.min(maxColumns, calculatedColumns - 1))
    
    // Triple check with actual width calculation
    const actualTotalWidth = ultraConservativeColumns * columnWidth.value + (ultraConservativeColumns - 1) * gap.value
    if (actualTotalWidth > availableWidth) {
      return Math.max(minColumns, ultraConservativeColumns - 1)
    }
    
    console.log(`Screen: ${window.innerWidth}px, Available: ${availableWidth}px, Columns: ${ultraConservativeColumns}, Total width: ${actualTotalWidth}px`)
    
    return ultraConservativeColumns
  })

  // Calculate how many products to display on screen (subset for rotation)
  const calculateMaxDisplayImages = (totalAvailable: number) => {
    if (typeof window === 'undefined') return 40
    
    // Calculate screen-based capacity for TV display
    const headerHeight = 0 // No header currently
    const footerHeight = 0 // AppFooter height
    const mainPadding = 20 // ProductGrid padding
    const bufferHeight = 10 // Safety buffer
    const availableHeight = window.innerHeight - headerHeight - footerHeight - mainPadding - bufferHeight
    
    const columns = numColumns.value
    const avgImageHeight = columnWidth.value * 0.9 // Estimate based on avg aspect ratio
    const imageWithMargin = avgImageHeight + 8 // Margin between images
    const imagesPerColumn = Math.floor(availableHeight / imageWithMargin)
    const screenCapacity = imagesPerColumn * columns
    
    // Use 70% of screen capacity for comfortable viewing
    const displayCount = Math.floor(screenCapacity * 0.7)
    
    // Set reasonable bounds for TV display
    const minDisplay = 20 // Minimum for good variety
    const maxDisplay = 50 // Maximum to leave room for rotation
    
    const finalCount = Math.max(minDisplay, Math.min(maxDisplay, displayCount))
    
    console.log(`📺 TV DISPLAY CALCULATION:`)
    console.log(`   • Screen: ${window.innerWidth}x${window.innerHeight}px`)
    console.log(`   • Screen capacity: ${screenCapacity} products`)
    console.log(`   • Display count: ${finalCount} products (${Math.round(finalCount/totalAvailable*100)}%)`)
    console.log(`   • Rotation queue: ${totalAvailable - finalCount} products`)
    
    return finalCount
  }

  // Handle window resize
  const handleResize = () => {
    // Trigger reactivity for numColumns
    columnWidth.value = columnWidth.value
  }

  return {
    columnWidth,
    gap,
    numColumns,
    calculateMaxDisplayImages,
    handleResize
  }
} 