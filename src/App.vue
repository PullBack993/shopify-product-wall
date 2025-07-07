<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
      <h1 class="store-title">{{ storeTitle }}</h1>
        <div class="status-info">
      <div class="status-indicator" :class="{ 'online': isOnline, 'offline': !isOnline }">
        {{ isOnline ? 'LIVE' : 'OFFLINE' }}
          </div>
          <button 
            v-if="!loading" 
            @click="shuffleImages" 
            class="shuffle-btn"
            :disabled="shuffling"
          >
            🔄 {{ shuffling ? 'Shuffling...' : 'Shuffle' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your fabric collection...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p>{{ error }}</p>
        <button @click="refreshProducts" class="retry-btn">
          Try Again
        </button>
    </div>
    
      <!-- Pinterest Grid -->
      <div 
        v-else
        class="grid-container" 
        :style="{ 
          columnCount: numColumns,
          columnGap: `${gap}px`
        }"
      >
        <GridItem
          v-for="image in displayImages"
          :key="image.id"
          :image="image"
        />
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="display-info">
        📱 Portrait TV | {{ displayImages.length }}/{{ gridImages.length }} Fabrics | {{ numColumns }} Cols | 🎯 C{{ currentCycle }}: {{ Math.round((rotationIndex / Math.max(rotationQueue.length, 1)) * 100) }}% | 🔄 Shown: {{ totalProductsShown }}
      </div>
      <div class="last-updated">
        Last updated: {{ lastUpdated }}
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOnline } from '@vueuse/core'
import GridItem from './components/GridItem.vue'
import { useProducts } from './composables/useProducts'
import type { GridImage } from './types'

const storeTitle = ref('STOFFEYA')
const isOnline = useOnline()

// Grid configuration for portrait TV display
const columnWidth = ref(300) // Optimized for no overflow
const gap = ref(8) // Minimal gap for maximum space usage
const shuffling = ref(false)

const { 
  gridImages,
  loading, 
  error, 
  lastUpdated,
  refreshProducts 
} = useProducts()

// Grid state
const displayImages = ref<GridImage[]>([])
const currentImageIndex = ref(0) // Track which image to replace next

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

// Calculate how many products to display - SHOW ALL AVAILABLE!
const maxDisplayImages = computed(() => {
  if (typeof window === 'undefined') return 40
  
  // For TV display: Show ALL available products, not limited by screen calculation
  const totalAvailable = gridImages.value.length
  
  if (totalAvailable > 0) {
    console.log(`📊 SHOWING ALL AVAILABLE PRODUCTS: ${totalAvailable}/${totalAvailable}`)
    return totalAvailable // Show every single product!
  }
  
  // Fallback calculation for when no products loaded yet
  const headerHeight = 100
  const footerHeight = 80 
  const mainPadding = 10
  const minimalBuffer = 5
  const availableHeight = window.innerHeight - headerHeight - footerHeight - mainPadding - minimalBuffer
  
  const columns = numColumns.value
  const avgAspectRatio = 1.075
  const estimatedImageHeight = columnWidth.value / avgAspectRatio
  const imageWithGap = estimatedImageHeight + 4
  const imagesPerColumn = Math.ceil(availableHeight / imageWithGap)
  const totalNeeded = imagesPerColumn * columns
  const bufferedTotal = totalNeeded + Math.ceil(columns * 2) // Extra buffer
  
  return Math.max(100, bufferedTotal) // Minimum 100 for fallback
})

// Initialize display images when gridImages loads
const initializeDisplayImages = () => {
  if (gridImages.value.length === 0) return
  
  const displayCount = maxDisplayImages.value
  // Shuffle and take only what we need for the screen
  const shuffled = [...gridImages.value].sort(() => Math.random() - 0.5)
  displayImages.value = shuffled.slice(0, displayCount)
  currentImageIndex.value = 0
  
  // Initialize rotation queue for cycling through ALL images
  initializeRotationQueue()
  
  console.log(`✅ DISPLAY INITIALIZED:`)
  console.log(`   • Screen shows: ${displayCount} products`)
  console.log(`   • Collection total: ${gridImages.value.length} products`)
  console.log(`   • Rotation will cycle through ALL ${gridImages.value.length} products`)
  
  // Verify we have the full collection
  if (gridImages.value.length < 1000) {
    console.warn(`⚠️  WARNING: Expected 1402+ products, but only got ${gridImages.value.length}`)
  } else {
    console.log(`✅ Full product collection loaded (${gridImages.value.length} items)`)
  }
}

// Watch for gridImages changes and initialize display
watch(gridImages, (newImages) => {
  if (newImages.length > 0) {
    initializeDisplayImages()
    
    // Start auto-rotation if not already started
    setTimeout(() => {
      if (displayImages.value.length > 0 && !rotateInterval) {
        startAutoRotate()
      }
    }, 1000)
  }
}, { immediate: true })

// Watch for screen size changes and reinitialize
watch([numColumns, maxDisplayImages], () => {
  if (gridImages.value.length > 0) {
    initializeDisplayImages()
  }
})

// Shuffle images with animation
const shuffleImages = async () => {
  if (shuffling.value || gridImages.value.length === 0) return
  
  shuffling.value = true
  
  try {
    // Reinitialize with fresh shuffle
    initializeDisplayImages()
    
    // Brief delay for user feedback
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    shuffling.value = false
  }
}

// Enhanced rotation system to cycle through ALL images with visual feedback
let rotationQueue = ref<GridImage[]>([]) // Queue of all images to cycle through
let rotationIndex = ref(0) // Index in the rotation queue
let totalProductsShown = ref(0) // Track how many unique products we've displayed
let currentCycle = ref(1) // Track which cycle we're on

// Initialize rotation queue with all available images
const initializeRotationQueue = () => {
  if (gridImages.value.length === 0) return
  
  // Create a shuffled queue of ALL images from the full collection
  rotationQueue.value = [...gridImages.value].sort(() => Math.random() - 0.5)
  rotationIndex.value = 0
  totalProductsShown.value = displayImages.value.length // Start with initial display count
  currentCycle.value = 1
  
  console.log(`🎯 ROTATION INITIALIZED:`)
  console.log(`   • Total products in collection: ${gridImages.value.length}`)
  console.log(`   • Products visible on screen: ${displayImages.value.length}`)
  console.log(`   • Rotation queue initialized with ALL ${rotationQueue.value.length} products`)
  console.log(`   • Will cycle through EVERY product in your collection!`)
}

// Rotate one product at a time through the entire collection
const rotateNextImage = () => {
  if (displayImages.value.length === 0 || rotationQueue.value.length === 0) return
  
  // Get the next image from our rotation queue
  const nextImage = rotationQueue.value[rotationIndex.value]
  
  // Pick a random position to replace (not sequential)
  const randomPosition = Math.floor(Math.random() * displayImages.value.length)
  
  const oldImage = displayImages.value[randomPosition]
  
  // Check if this is a new product (not currently on screen)
  const isNewProduct = !displayImages.value.some(img => 
    img.text === nextImage.text || img.id.includes(nextImage.id.toString())
  )
  
  if (isNewProduct) {
    totalProductsShown.value++
  }
  
  // Replace the image at random position
  const newImageData = {
    ...nextImage,
    // Force reactivity with new key to ensure visual update
    id: `${nextImage.id}-rotation-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      // Add timestamp to force URL change detection  
  url: `${nextImage.url}?v=${Date.now()}`
  }
  
  console.log(`🔄 Replacing image at position ${randomPosition}:`)
  console.log(`   Old: ${oldImage.url} | ${oldImage.text}`)
  console.log(`   New: ${newImageData.url} | ${newImageData.text}`)
  
  displayImages.value[randomPosition] = newImageData
  
  // Enhanced logging to show real progress
  const progressPercent = Math.round((rotationIndex.value / rotationQueue.value.length) * 100)
  const cycleInfo = `Cycle ${currentCycle.value}`
  
  console.log(`🔄 ROTATION UPDATE:`)
  console.log(`   • Position ${randomPosition}: "${oldImage.text}" → "${nextImage.text}"`)
  console.log(`   • Progress: ${rotationIndex.value + 1}/${rotationQueue.value.length} (${progressPercent}%)`)
  console.log(`   • ${cycleInfo} | Total unique products shown: ${totalProductsShown.value}`)
  console.log(`   • New product on screen: ${isNewProduct ? 'YES ✨' : 'No (replacing)'}`)
  
  // Move to next image in queue
  rotationIndex.value = (rotationIndex.value + 1) % rotationQueue.value.length
  
  // If we've completed a full cycle, reshuffle the queue
  if (rotationIndex.value === 0) {
    currentCycle.value++
    console.log(``)
    console.log(`🎉 CYCLE ${currentCycle.value - 1} COMPLETE!`)
    console.log(`   • ALL ${rotationQueue.value.length} products have been shown`)
    console.log(`   • Starting Cycle ${currentCycle.value} with reshuffled queue`)
    console.log(`   • Total unique products displayed so far: ${totalProductsShown.value}`)
    console.log(``)
    rotationQueue.value = [...gridImages.value].sort(() => Math.random() - 0.5)
  }
}

// Auto-refresh and rotation intervals
let refreshInterval: NodeJS.Timeout
let rotateInterval: NodeJS.Timeout

// Auto rotate for TV display - change one product every 45 seconds
const startAutoRotate = () => {
  // For development testing, use 2 seconds. For production TV display, use 45 seconds
  const rotationInterval = import.meta.env.DEV ? 2000 : 45000 // 2 seconds in dev, 45 seconds in production
  
  console.log(`Starting auto-rotation with ${rotationInterval / 1000} second intervals`)
  
  // Rotate one product every interval
  rotateInterval = setInterval(() => {
    rotateNextImage()
  }, rotationInterval)
}

const stopAutoRotate = () => {
  if (rotateInterval) {
    clearInterval(rotateInterval)
  }
}

// Handle window resize
const handleResize = () => {
  // Trigger reactivity for numColumns
  columnWidth.value = columnWidth.value
}

// Manual rotation for testing (spacebar in dev mode)
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.code === 'Space' && import.meta.env.DEV) {
    event.preventDefault()
    rotateNextImage()
    console.log('Manual rotation triggered (spacebar)')
  }
}

onMounted(() => {
  // Auto-refresh every 30 minutes
  refreshInterval = setInterval(() => {
    refreshProducts()
  }, 30 * 60 * 1000)
  
  // Listen for window resize
  window.addEventListener('resize', handleResize)
  
  // Listen for keyboard events (spacebar for manual rotation in dev)
  window.addEventListener('keydown', handleKeyPress)
  
  // Start auto-rotation once display is initialized
  setTimeout(() => {
    if (displayImages.value.length > 0) {
      startAutoRotate()
    }
  }, 2000) // Wait 2 seconds for initial load
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  
  stopAutoRotate()
  
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style lang="scss" scoped>
.app {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent any overflow */
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(102, 126, 234, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 40px;
  
  .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
    width: 100%;
  }
}
  
  .store-title {
    font-size: 2.5rem;
    font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;
  margin: 0;
  background: linear-gradient(45deg, #ffffff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 16px;
  }
  
  .status-indicator {
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    
    &.online {
      background: #4ade80;
      color: #065f46;
    }
    
    &.offline {
      background: #f87171;
      color: #7f1d1d;
    }
  }

.shuffle-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.main-content {
  flex: 1;
  padding: 5px 30px; /* Minimal top/bottom padding */
  width: 100%;
  height: 0; /* Allow flexbox to calculate height */
  overflow: hidden; /* Prevent content overflow */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  
  // Optimize for portrait TV layout
  .grid-container {
    width: 100%;
    max-width: none;
    height: 100%;
    column-fill: auto; /* Better top-to-bottom filling */
    column-gap: 8px; /* Match the gap ref value */
    overflow: hidden; /* Prevent grid overflow */
    padding: 0;
    margin: 0;
    
    // Ensure items stack properly in columns
    & > * {
      break-inside: avoid;
      display: inline-block;
      width: 100%;
      vertical-align: top;
      box-sizing: border-box;
    }
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

/* Grid container styles moved to .main-content .grid-container */

.footer {
  background: rgba(0, 0, 0, 0.2);
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .display-info {
    font-weight: 600;
    opacity: 0.9;
  }
  
  .last-updated {
    opacity: 0.8;
    font-size: 0.9rem;
    
    .dev-hint {
      color: #ffd700;
      font-weight: 600;
      opacity: 0.9;
      animation: pulse 2s ease-in-out infinite;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.5; }
}

@media (max-width: 1200px) {
  .main-content {
    padding: 25px;
  }
  
  .header {
    padding: 16px 25px;
  }
  
  .footer {
    padding: 16px 25px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: row; /* Keep horizontal for TV */
    gap: 16px;
    justify-content: space-between;
  }
  
  .store-title {
    font-size: 2rem;
  }
  
  .status-info {
    justify-content: flex-end;
  }
  
  .main-content {
    padding: 20px;
  }
  
  .grid-container {
    column-gap: 20px;
  }
  
  .footer {
    padding: 16px 20px;
    flex-direction: row; /* Keep horizontal for TV */
    gap: 8px;
    justify-content: space-between;
  }
}
</style> 