import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useRotation(products, options = {}) {
  const {
    gridSize = 15,           // Number of products to display at once (optimized for 3x5 vertical TV grid)
    rotationInterval = 1500, // Rotation interval in milliseconds (1.5 seconds for engaging display)
    animationDuration = 700, // Animation duration in milliseconds
    shuffleOnStart = true,   // Whether to shuffle products initially
    burstMode = true         // Occasionally rotate multiple items quickly
  } = options

  const displayedProducts = ref([])
  const availableProducts = ref([])
  const usedProductIds = ref(new Set())
  const isRotating = ref(false)
  const rotationCount = ref(0)
  const burstCount = ref(0)
  
  let rotationTimer = null

  // Calculate rotation progress (cycling through all products)
  const rotationProgress = computed(() => {
    if (!availableProducts.value || availableProducts.value.length === 0) return 0
    const totalCycles = Math.ceil(availableProducts.value.length / gridSize)
    const currentCycle = Math.floor(rotationCount.value / availableProducts.value.length * totalCycles)
    return ((currentCycle % totalCycles) + 1) / totalCycles * 100
  })

  // Get next position to replace (random or sequential)
  const getNextPositionToReplace = () => {
    if (displayedProducts.value.length === 0) return 0
    return Math.floor(Math.random() * displayedProducts.value.length)
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Get next product to display (not currently shown)
   */
  const getNextProduct = () => {
    if (!availableProducts.value || availableProducts.value.length === 0) return null

    // Find products not currently displayed
    const unusedProducts = availableProducts.value.filter(
      product => !usedProductIds.value.has(product.id)
    )

    // If all products have been used, reset and start over
    if (unusedProducts.length === 0) {
      usedProductIds.value.clear()
      console.log('🔄 All products displayed, starting new cycle')
      return availableProducts.value[0]
    }

    // Return random unused product
    const randomIndex = Math.floor(Math.random() * unusedProducts.length)
    return unusedProducts[randomIndex]
  }

  /**
   * Initialize the grid with first set of products
   */
  const initializeGrid = () => {
    if (!availableProducts.value || availableProducts.value.length === 0) return

    const initialProducts = shuffleOnStart 
      ? shuffleArray(availableProducts.value) 
      : [...availableProducts.value]

    const productsToShow = initialProducts.slice(0, Math.min(gridSize, initialProducts.length))
    
    displayedProducts.value = productsToShow
    usedProductIds.value = new Set(productsToShow.map(p => p.id))
    
    console.log(`🎯 Initialized 3x5 vertical TV grid with ${productsToShow.length} products`)
  }

  /**
   * Rotate one product in the grid
   */
  const rotateNext = async () => {
    if (isRotating.value || displayedProducts.value.length === 0) return
    if (!availableProducts.value || availableProducts.value.length <= gridSize) return

    isRotating.value = true
    
    try {
      // Get next product to display
      const nextProduct = getNextProduct()
      if (!nextProduct) return

      // Choose position to replace
      const positionToReplace = getNextPositionToReplace()
      const productToRemove = displayedProducts.value[positionToReplace]
      
      // Update the displayed products array
      const newDisplayedProducts = [...displayedProducts.value]
      newDisplayedProducts[positionToReplace] = nextProduct

      // Update tracking sets
      usedProductIds.value.delete(productToRemove.id)
      usedProductIds.value.add(nextProduct.id)

      // Apply the change
      displayedProducts.value = newDisplayedProducts
      rotationCount.value++

      console.log(`🔄 Replaced "${productToRemove.title}" with "${nextProduct.title}" at position ${positionToReplace}`)

    } catch (error) {
      console.error('Error during rotation:', error)
    } finally {
      // Short delay to ensure smooth transitions
      setTimeout(() => {
        isRotating.value = false
      }, animationDuration / 4)
    }
  }

  /**
   * Start automatic rotation with burst mode
   */
  const startRotation = () => {
    if (rotationTimer) return // Already running
    
    const scheduleNextRotation = () => {
      let nextInterval = rotationInterval
      
      // Burst mode: Every 8th rotation, do rapid rotations
      if (burstMode && rotationCount.value > 0 && rotationCount.value % 8 === 0) {
        burstCount.value++
        nextInterval = 400 // Quick burst (0.4 seconds)
        console.log(`💥 Burst mode activated! (${burstCount.value})`)
      }
      
      rotationTimer = setTimeout(() => {
        rotateNext()
        scheduleNextRotation()
      }, nextInterval)
    }
    
    scheduleNextRotation()
    console.log(`🚀 Started dynamic rotation (${rotationInterval}ms base, ${gridSize} products, burst mode: ${burstMode})`)
  }

  /**
   * Stop automatic rotation
   */
  const stopRotation = () => {
    if (rotationTimer) {
      clearTimeout(rotationTimer)
      rotationTimer = null
      console.log('⏹️ Stopped product rotation')
    }
  }

  /**
   * Restart rotation (useful when options change)
   */
  const restartRotation = () => {
    stopRotation()
    if (displayedProducts.value.length > 0) {
      startRotation()
    }
  }

  /**
   * Manually rotate to next product
   */
  const rotateManual = () => {
    rotateNext()
  }

  /**
   * Reset the grid and start fresh
   */
  const resetRotation = () => {
    stopRotation()
    usedProductIds.value.clear()
    rotationCount.value = 0
    initializeGrid()
    startRotation()
  }

  /**
   * Shuffle current grid in place
   */
  const shuffleGrid = () => {
    if (displayedProducts.value.length === 0) return
    displayedProducts.value = shuffleArray([...displayedProducts.value])
    console.log('🔀 Shuffled current grid')
  }

  // Watch for products changes
  watch(products, (newProducts) => {
    if (newProducts && newProducts.length > 0) {
      // Update available products
      availableProducts.value = [...newProducts]
      
      // If this is the first load or we have no displayed products, initialize
      if (displayedProducts.value.length === 0) {
        initializeGrid()
      }
      
      // Start rotation if we have enough products for rotation
      if (newProducts.length > gridSize) {
        startRotation()
      } else {
        stopRotation()
      }
      
      console.log(`📦 Updated with ${newProducts.length} available products`)
    } else {
      stopRotation()
      displayedProducts.value = []
      availableProducts.value = []
      usedProductIds.value.clear()
    }
  }, { immediate: true })

  // Cleanup on unmount
  onUnmounted(() => {
    stopRotation()
  })

  return {
    displayedProducts,
    availableProducts,
    rotationProgress,
    isRotating,
    rotationCount,
    burstCount,
    rotateNext,
    rotateManual,
    startRotation,
    stopRotation,
    restartRotation,
    resetRotation,
    shuffleGrid,
    gridSize: ref(gridSize),
    rotationInterval: ref(rotationInterval),
    burstMode: ref(burstMode)
  }
} 