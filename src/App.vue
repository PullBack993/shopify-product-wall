<template>
  <div class="app">
    <ProductGrid 
      :loading="loading"
      :error="error"
      :display-images="displayImages"
      :num-columns="numColumns"
      :gap="gap"
      @retry="refreshProducts"
    />

    <!-- Brand Display -->
    <div class="brand-display">
      <div class="brand-content">
        <img src="/logo.png" alt="STOFFEYA Logo" class="brand-logo" />
        <div class="brand-text">
          <div class="invitation-text">Besuchen Sie uns online</div>
          <div class="website-name">stoffeya.at</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import ProductGrid from './components/ProductGrid.vue'
import { useProducts } from './composables/useProducts'
import { useGridLayout } from './composables/useGridLayout'
import { useImageRotation } from './composables/useImageRotation'

const shuffling = ref(false)

// Use composables
const { gridImages, loading, error, refreshProducts } = useProducts()
const { numColumns, gap, calculateMaxDisplayImages, handleResize } = useGridLayout()
const imageRotation = useImageRotation(gridImages)

// Extract reactive values from image rotation
const {
  displayImages,
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
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent any overflow */
}

.brand-display {
  background: rgba(51, 35, 19, 0.3);
  border-top: 1px solid rgba(51, 35, 19, 0.2);
  padding: 10px 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  
      .brand-content {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
      
      .brand-logo {
        height: 50px;
      }
      
      .brand-text {
        display: flex;
        align-items: center;
        gap: 10px;
        
        .invitation-text {
          font-size: 1.1rem;
          font-weight: 400;
          color: var(--text-light);
          font-family: var(--font-family);
          opacity: 0.9;
          font-style: italic;
        }
        
        .website-name {
          font-size: 2rem;
          font-weight: 700;
          text-transform: uppercase;
          font-family: var(--font-family);
          color: var(--text-light);        
        }
      }
    }
}


</style> 