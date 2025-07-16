<template>
  <main class="main-content">
    <!-- Loading State -->
    <LoadingState v-if="loading" />

    <!-- Error State -->
    <ErrorState v-else-if="error" :error="error" @retry="$emit('retry')" />
    
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
        v-for="(image, index) in currentDisplayImages"
        :key="image.id"
        :image="image"
        :color-scheme="index % 2 === 0 ? 'scheme-6' : 'scheme-3'"
        :data-position="index"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import GridItem from './GridItem.vue'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import type { GridImage } from '../types'
import { useGridLayout } from '../composables/useGridLayout'

interface Props {
  loading: boolean
  error: string | null
  displayImages: GridImage[]
  numColumns: number
  gap: number
}

const props = defineProps<Props>()

defineEmits<{
  retry: []
}>()

// Use grid layout composable for capacity calculation
const { calculateMaxDisplayImages } = useGridLayout()

// State for image rotation within this view
const currentDisplayImages = ref<GridImage[]>([])
const usedProductIds = ref<Set<string>>(new Set()) // Track used product IDs to prevent duplicates
const lastRotationTime = ref(0) // Track when last rotation occurred
const recentlyRotatedIds = ref<Map<string, number>>(new Map()) // Track recently rotated products with timestamps

let rotationInterval: ReturnType<typeof setInterval> | null = null

const COOLDOWN_PERIOD = 30000 // 30 seconds cooldown before a product can be rotated back in

// Get the base product ID (remove rotation suffixes)
const getBaseProductId = (id: string): string => {
  return id.split('-rotation-')[0].split('-initial-')[0]
}

// Check if a product is already displayed
const isProductAlreadyDisplayed = (productId: string): boolean => {
  const baseId = getBaseProductId(productId)
  return usedProductIds.value.has(baseId)
}

// Add a product to the used set
const markProductAsUsed = (productId: string): void => {
  const baseId = getBaseProductId(productId)
  usedProductIds.value.add(baseId)
}

// Remove a product from the used set
const markProductAsUnused = (productId: string): void => {
  const baseId = getBaseProductId(productId)
  usedProductIds.value.delete(baseId)
}

// Add a product to the cooldown list
const addToCooldown = (productId: string): void => {
  const baseId = getBaseProductId(productId)
  recentlyRotatedIds.value.set(baseId, Date.now())
}

// Check if a product is in cooldown period
const isInCooldown = (productId: string): boolean => {
  const baseId = getBaseProductId(productId)
  const rotatedTime = recentlyRotatedIds.value.get(baseId)
  
  if (!rotatedTime) return false
  
  const timeSinceRotation = Date.now() - rotatedTime
  return timeSinceRotation < COOLDOWN_PERIOD
}

// Clean up expired cooldowns
const cleanupExpiredCooldowns = (): void => {
  const now = Date.now()
  for (const [productId, timestamp] of recentlyRotatedIds.value.entries()) {
    if (now - timestamp >= COOLDOWN_PERIOD) {
      recentlyRotatedIds.value.delete(productId)
    }
  }
}

// Get available products for rotation (not displayed and not in cooldown)
const getAvailableProductsForRotation = (): any[] => {
  return props.displayImages.filter(product => {
    const baseId = getBaseProductId(product.id)
    return !usedProductIds.value.has(baseId) && !isInCooldown(product.id)
  })
}

// Rotate one image every few seconds within the current view's product set
const rotateImage = () => {
  if (props.displayImages.length === 0 || currentDisplayImages.value.length === 0) {
    return
  }
  
  const totalProducts = props.displayImages.length
  
  // Clean up expired cooldowns first
  cleanupExpiredCooldowns()
  
  // Pick a random position to change
  const positionToChange = Math.floor(Math.random() * currentDisplayImages.value.length)
  const oldImage = currentDisplayImages.value[positionToChange]
  
  // Remove the current product from used set and add to cooldown
  const currentProductId = oldImage?.id
  if (currentProductId) {
    markProductAsUnused(currentProductId)
    addToCooldown(currentProductId)
  }
  
  // Get available products (not displayed and not in cooldown)
  const availableProducts = getAvailableProductsForRotation()
  
  let newImage: any
  
  if (availableProducts.length === 0) {
    // If no products available, try just excluding displayed ones (ignore cooldown)
    const availableIgnoringCooldown = props.displayImages.filter(product => 
      !isProductAlreadyDisplayed(product.id)
    )
    
    if (availableIgnoringCooldown.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableIgnoringCooldown.length)
      newImage = availableIgnoringCooldown[randomIndex]
    } else {
      // Last resort: reset everything and use first available
      usedProductIds.value.clear()
      recentlyRotatedIds.value.clear()
      
      if (props.displayImages.length > 0) {
        newImage = props.displayImages[0]
      } else {
        return
      }
    }
  } else {
    // Pick a random available product
    const randomIndex = Math.floor(Math.random() * availableProducts.length)
    newImage = availableProducts[randomIndex]
  }
  
  // Mark new product as used
  markProductAsUsed(newImage.id)
  
  // Simple single-item update - just replace the item directly
  currentDisplayImages.value[positionToChange] = {
    ...newImage,
    id: `${newImage.id}-rotation-${Date.now()}`
  }
  
  // Track rotation timing
  lastRotationTime.value = Date.now()
  
  // Schedule next rotation with a new random delay
  scheduleNextRotation()
}

// Schedule the next rotation with a new random delay
const scheduleNextRotation = () => {
  // Clear any existing timer
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
  
  // Get a new random delay for the next rotation (8-12 seconds)
  const rotationDelay = 8000 + Math.random() * 4000
  
  rotationInterval = setInterval(() => {
    rotateImage()
  }, rotationDelay)
}

// Start rotation when images are available
const startRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
  
  if (props.displayImages.length === 0) {
    return
  }
  
  // Initialize rotation timing
  lastRotationTime.value = Date.now()
  
  // Schedule the first rotation
  scheduleNextRotation()
}

// Stop rotation
const stopRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
}

// Initialize display images when props change
watch(() => props.displayImages, (newImages, oldImages) => {
  // Stop any existing rotation
  stopRotation()
  
  if (newImages.length > 0) {
    // Calculate actual screen capacity based on layout
    const screenCapacity = calculateMaxDisplayImages(newImages.length)
    const maxDisplayCount = Math.min(screenCapacity, newImages.length)
    
    // Clear all tracking (used products and cooldowns)
    usedProductIds.value.clear()
    recentlyRotatedIds.value.clear()
    
    const initialImages = newImages.slice(0, maxDisplayCount)
    
    // Mark initial products as used
    initialImages.forEach(img => markProductAsUsed(img.id))
    
    currentDisplayImages.value = initialImages.map((img, index) => ({
      ...img,
      id: `${img.id}-initial-${Date.now()}`,
    }))
    
    // Start rotation after a delay to let images settle
    setTimeout(() => {
      if (props.displayImages.length > maxDisplayCount) { // Only rotate if we have extra products
        startRotation()
      }
    }, 3000)
  } else {
    currentDisplayImages.value = []
    usedProductIds.value.clear()
    recentlyRotatedIds.value.clear()
  }
}, { immediate: true })

onMounted(() => {
  // Development helper: Add global function to check rotation status
  if (import.meta.env.DEV) {
    ;(window as any).checkVerticalGridRotation = () => {
      const timeSinceLastRotation = Date.now() - lastRotationTime.value
      const cooldownList = Array.from(recentlyRotatedIds.value.entries()).map(([id, timestamp]) => ({
        productId: id,
        timeRemaining: Math.max(0, COOLDOWN_PERIOD - (Date.now() - timestamp))
      }))
      
      // Test available products for rotation
      const availableForRotation = getAvailableProductsForRotation()
      
      return {
        displayImages: currentDisplayImages.value.length,
        availableProducts: props.displayImages.length,
        usedProducts: usedProductIds.value.size,
        productsInCooldown: recentlyRotatedIds.value.size,
        rotationActive: rotationInterval !== null,
        timeSinceLastRotation: timeSinceLastRotation,
        cooldownPeriod: COOLDOWN_PERIOD,
        availableForRotation: availableForRotation.length,
        cooldownList: cooldownList
      }
    }
  }
})

onUnmounted(() => {
  stopRotation()
  
  // Clean up tracking
  usedProductIds.value.clear()
  recentlyRotatedIds.value.clear()
})
</script>

<style lang="scss" scoped>
.main-content {
  flex: 1;
  padding: 5px 10px;
  width: 100%;
  height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: transparent;
  
  .grid-container {
    width: 100%;
    max-width: none;
    flex: 1;
    height: 100%;
    min-height: 100%;
    column-fill: balance; /* Balance column heights to avoid empty spaces */
    overflow: hidden;
    padding: 0;
    margin: 0;
    display: block;
    box-sizing: border-box;
    
    // Better space utilization with image quality optimization
    & > * {
      break-inside: avoid;
      display: inline-block;
      width: 100%;
      vertical-align: top;
      box-sizing: border-box;
      margin-bottom: 3px; /* Slightly increased for better visual separation */
      
      /* Optimize rendering for better image quality */
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      image-rendering: optimizeQuality;
      will-change: transform;
      
      // Remove margin from last items to maximize space
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    // Force balanced distribution
    &::before {
      content: '';
      display: block;
      width: 100%;
      height: 0;
    }
    
    // Ensure content fills available height
    &::after {
      content: '';
      display: block;
      height: 100%;
      width: 0;
      visibility: hidden;
    }
  }
}

.grid-container > * {
  height: auto;
  min-height: 180px; // optional, for minimum size
  object-fit: cover;
}
</style> 