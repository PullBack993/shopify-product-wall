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

// State for image rotation within this view
const currentDisplayImages = ref<GridImage[]>([])
const rotationIndex = ref(0)
const usedProductIds = ref<Set<string>>(new Set()) // Track used product IDs to prevent duplicates

let rotationInterval: ReturnType<typeof setInterval> | null = null

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

// Rotate one image every few seconds within the current view's product set
const rotateImage = () => {
  if (props.displayImages.length === 0) return
  
  const currentImages = [...currentDisplayImages.value]
  const totalProducts = props.displayImages.length
  
  if (totalProducts === 0) return
  
  // Pick a random position to change
  const positionToChange = Math.floor(Math.random() * currentImages.length)
  
  // Remove the current product from used set
  const currentProductId = currentImages[positionToChange]?.id
  if (currentProductId) {
    markProductAsUnused(currentProductId)
  }
  
  // Find a new product that's not currently displayed
  const availableProducts = props.displayImages.filter(product => 
    !isProductAlreadyDisplayed(product.id)
  )
  
  if (availableProducts.length === 0) {
    // If no new products available, reset the used set and try again
    usedProductIds.value.clear()
    const resetAvailableProducts = props.displayImages.filter(product => 
      !isProductAlreadyDisplayed(product.id)
    )
    
    if (resetAvailableProducts.length === 0) {
      return // No products available at all
    }
    
    const newImage = resetAvailableProducts[0]
    markProductAsUsed(newImage.id)
    
    currentImages[positionToChange] = {
      ...newImage,
      id: `${newImage.id}-rotation-${Date.now()}`
    }
  } else {
    // Pick a random available product
    const randomIndex = Math.floor(Math.random() * availableProducts.length)
    const newImage = availableProducts[randomIndex]
    markProductAsUsed(newImage.id)
    
    currentImages[positionToChange] = {
      ...newImage,
      id: `${newImage.id}-rotation-${Date.now()}`
    }
  }
  
  currentDisplayImages.value = currentImages
}

// Start rotation when images are available
const startRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
  }
  
  // Rotate every 8-12 seconds
  const rotationDelay = 8000 + Math.random() * 4000
  rotationInterval = setInterval(rotateImage, rotationDelay)
}

// Stop rotation
const stopRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
}

// Initialize display images when props change
watch(() => props.displayImages, (newImages) => {
  if (newImages.length > 0) {
    // Clear the used products set
    usedProductIds.value.clear()
    
    // Show the first N images (based on screen capacity)
    const maxDisplayCount = Math.min(20, newImages.length) // Show up to 20 images
    const initialImages = newImages.slice(0, maxDisplayCount)
    
    // Mark initial products as used
    initialImages.forEach(img => markProductAsUsed(img.id))
    
    currentDisplayImages.value = initialImages.map(img => ({
      ...img,
      id: `${img.id}-initial-${Date.now()}`
    }))
    
    // Start rotation after a delay
    setTimeout(() => {
      startRotation()
    }, 3000)
  }
}, { immediate: true })

onMounted(() => {
  // Component mounted logic
})

onUnmounted(() => {
  stopRotation()
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

// Responsive adjustments for better space filling
@media (min-height: 800px) {
  .main-content .grid-container {
    column-fill: auto; /* On taller screens, allow natural filling */
  }
}

@media (max-height: 600px) {
  .main-content {
    padding: 2px 8px; /* Reduce padding on shorter screens */
    
    .grid-container > * {
      margin-bottom: 1px; /* Even tighter spacing */
    }
  }
}

.grid-container > * {
  height: auto;
  min-height: 180px; // optional, for minimum size
  object-fit: cover;
}
</style> 