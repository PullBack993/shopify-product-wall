<template>
  <div class="app">
    <!-- Header -->
    <!-- <AppHeader 
      :store-title="storeTitle"
      :is-online="isOnline"
      :loading="loading"
      :shuffling="shuffling"
      @shuffle="handleShuffle"
    /> -->

    <!-- Main Content -->
    <ProductGrid 
      :loading="loading"
      :error="error"
      :display-images="displayImages"
      :num-columns="numColumns"
      :gap="gap"
      @retry="refreshProducts"
    />

    <!-- Footer -->
    <AppFooter 
      :display-count="displayImages.length"
      :total-count="gridImages.length"
      :num-columns="numColumns"
      :current-cycle="currentCycle"
      :rotation-index="rotationIndex"
      :rotation-queue-length="rotationQueue.length"
      :total-products-shown="totalProductsShown"
      :last-updated="lastUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
// import { useOnline } from '@vueuse/core'
import AppHeader from './components/AppHeader.vue'
import ProductGrid from './components/ProductGrid.vue'
import AppFooter from './components/AppFooter.vue'
import { useProducts } from './composables/useProducts'
import { useGridLayout } from './composables/useGridLayout'
import { useImageRotation } from './composables/useImageRotation'
import { useAutoRefresh } from './composables/useAutoRefresh'

const storeTitle = ref('STOFFEYA')
// const isOnline = useOnline()
const shuffling = ref(false)

// Use composables
const { gridImages, loading, error, lastUpdated, refreshProducts } = useProducts()
const { numColumns, gap, calculateMaxDisplayImages, handleResize } = useGridLayout()
const imageRotation = useImageRotation(gridImages)
const { startAutoRefresh, stopAutoRefresh } = useAutoRefresh(refreshProducts)

// Extract reactive values from image rotation
const {
  displayImages,
  rotationQueue,
  rotationIndex,
  totalProductsShown,
  currentCycle,
  initializeDisplayImages,
  startAutoRotate,
  stopAutoRotate,
  shuffleImages,
  handleKeyPress
} = imageRotation

// Calculate max display images
const maxDisplayImages = computed(() => calculateMaxDisplayImages(gridImages.value.length))

// Initialize display images when gridImages loads
watch(gridImages, (newImages) => {
  if (newImages.length > 0) {
    initializeDisplayImages(maxDisplayImages.value)
    
    // Start auto-rotation if not already started
    setTimeout(() => {
      if (displayImages.value.length > 0) {
        startAutoRotate()
      }
    }, 1000)
  }
}, { immediate: true })

// Watch for screen size changes and reinitialize
watch([numColumns, maxDisplayImages], () => {
  if (gridImages.value.length > 0) {
    initializeDisplayImages(maxDisplayImages.value)
  }
})

// Handle shuffle with loading state
const handleShuffle = async () => {
  if (shuffling.value || gridImages.value.length === 0) return
  
  shuffling.value = true
  
  try {
    await shuffleImages(maxDisplayImages.value)
  } finally {
    shuffling.value = false
  }
}

onMounted(() => {
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
</style> 