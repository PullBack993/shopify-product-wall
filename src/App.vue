<template>
  <div class="app">
    <!-- Social Media Display -->
    <div class="social-display">
      <div class="social-item">
        <svg viewBox="0 0 24 24" class="social-icon">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span class="social-text">Stoffeya</span>
      </div>
      <div class="social-item">
        <svg viewBox="0 0 24 24" class="social-icon">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        <span class="social-text">@stoffeya_official</span>
      </div>
      <div class="social-item">
        <svg viewBox="0 0 24 24" class="social-icon">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
        <span class="social-text">@stoffeya</span>
      </div>
    </div>

    <!-- View Indicator (Dev Mode Only) -->
    <div v-if="isDev" class="view-indicator">
      <div class="view-info">
        <span class="view-name">{{ currentView.name }}</span>
        <span class="view-shortcuts">
          Press 1-4 to switch views • A to toggle auto-switch • ←→ to navigate
        </span>
      </div>
      <div class="view-timer" v-if="autoSwitchEnabled">
        Next: {{ Math.ceil((timeUntilNextSwitch || 0) / 1000) }}s
      </div>
    </div>

    <!-- Dynamic Component Rendering -->
    <component 
      :is="currentComponentName"
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
          <div class="invitation-text">Folgen Sie uns online</div>
          <div class="website-name">stoffeya.at</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import ProductGrid from './components/ProductGrid.vue'
import VerticalGrid from './components/VerticalGrid.vue'
import ProductSlideshow from './components/ProductSlideshow.vue'
import ProductMosaic from './components/ProductMosaic.vue'
import { useProducts } from './composables/useProducts'
import { useGridLayout } from './composables/useGridLayout'
import { useImageRotation } from './composables/useImageRotation'
import { useViewManager } from './composables/useViewManager'
import { useProductDistribution } from './composables/useProductDistribution'

const shuffling = ref(false)
const isDev = import.meta.env.DEV

// Use composables
const { products, loading, error, refreshProducts } = useProducts()
const { numColumns, gap, calculateMaxDisplayImages, handleResize } = useGridLayout()
const productDistribution = useProductDistribution()
const viewManager = useViewManager()

// Extract reactive values from composables
const {
  setAllProducts,
  getGridImagesForView,
  moveToNextViewProducts,
  getCurrentCycleInfo,
  resetToBeginning,
  categoryCounts
} = productDistribution

const {
  currentView,
  autoSwitchEnabled,
  getTimeUntilNextSwitch,
  handleKeyPress: handleViewKeyPress,
  initialize: initializeViewManager,
  cleanup: cleanupViewManager,
  updateProductStats
} = viewManager

// Get current view's products
const displayImages = computed(() => getGridImagesForView(currentView.value.id))

// Get current component name for dynamic rendering
const currentComponentName = computed(() => {
  const componentMap: Record<string, any> = {
    'ProductGrid': ProductGrid,
    'VerticalGrid': VerticalGrid,
    'ProductSlideshow': ProductSlideshow,
    'ProductMosaic': ProductMosaic,
  }
  
  return componentMap[currentView.value.component] || ProductGrid
})

// Time until next view switch
const timeUntilNextSwitch = ref<number | null>(null)

// Update timer display
const updateTimer = () => {
  timeUntilNextSwitch.value = getTimeUntilNextSwitch()
}

// Initialize product distribution when products load
watch(products, (newProducts) => {
  if (newProducts.length > 0) {
    setAllProducts(newProducts)
    // Update product statistics in view manager
    updateProductStats(newProducts.length, displayImages.value, categoryCounts.value)
  }
}, { immediate: true })

// Watch for view changes and update product statistics
watch(currentView, (newView, oldView) => {
  if (newView.id !== oldView?.id) {
    // Update product statistics when view changes
    updateProductStats(products.value.length, displayImages.value, categoryCounts.value)
  }
})

// Watch for changes in display images to update statistics
watch(displayImages, (newImages) => {
  if (products.value.length > 0) {
    updateProductStats(products.value.length, newImages, categoryCounts.value)
  }
})

// Listen for view switch events to handle product distribution
let viewSwitchListener: ((event: Event) => void) | null = null

onMounted(() => {
  viewSwitchListener = (event: any) => {
    // Move to next set of products when view changes
    moveToNextViewProducts(event.detail.fromView)
  }
  
  document.addEventListener('viewSwitched', viewSwitchListener)
})

// Combined keyboard handler
const handleKeyPress = (event: KeyboardEvent) => {
  // Handle view switching first
  handleViewKeyPress(event)
  
  // Handle product distribution keys
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault()
    resetToBeginning()
  }
}

onMounted(() => {
  // Listen for window resize
  window.addEventListener('resize', handleResize)
  
  // Listen for keyboard events
  window.addEventListener('keydown', handleKeyPress)
  
  // Initialize view manager
  initializeViewManager()
  
  // Start timer updates for dev mode
  if (isDev) {
    setInterval(updateTimer, 1000)
  }
})

onUnmounted(() => {
  cleanupViewManager()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyPress)
  
  // Clean up view switch listener
  if (viewSwitchListener) {
    document.removeEventListener('viewSwitched', viewSwitchListener)
  }
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
  overflow: hidden;
  position: relative;
}

// View indicator for development
.view-indicator {
  position: fixed;
  top: 15px;
  left: 20px;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  .view-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .view-name {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }
    
    .view-shortcuts {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.7);
      font-family: monospace;
    }
  }
  
  .view-timer {
    margin-top: 4px;
    font-size: 0.8rem;
    color: #4CAF50;
    font-weight: 500;
  }
}

.social-display {
  position: fixed;
  bottom: 3px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;

  .social-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(51, 35, 19, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 25px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    
    .social-icon {
      width: 18px;
      height: 18px;
      fill: var(--text-light);
      flex-shrink: 0;
    }
    
    .social-text {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-light);
      font-family: var(--font-family);
      white-space: nowrap;
    }
  }
}

.brand-display {
  background: rgba(51, 35, 19, 0.3);
  border-top: 1px solid rgba(51, 35, 19, 0.2);
  padding: 5px 20px;
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
      height: 30px;
    }
    
    .brand-text {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      justify-content: center;
      
      .invitation-text {
        font-size: 0.9rem;
        font-weight: 400;
        color: var(--text-light);
        font-family: var(--font-family);
        opacity: 0.9;
        font-style: italic;
      }
      
      .website-name {
        font-size: 1.5rem;
        font-weight: 700;
        text-transform: uppercase;
        font-family: var(--font-family);
        color: var(--text-light);        
      }
    }
  }
  
  // Responsive adjustments
  @media (max-width: 768px) {
    padding: 5px 15px;
    
    .brand-content {
      flex-direction: column;
      gap: 10px;
      
      .brand-text {
        flex-direction: column;
        gap: 5px;
        text-align: center;
        
        .invitation-text {
          font-size: 0.8rem;
        }
        
        .website-name {
          font-size: 1.2rem;
        }
      }
    }
  }
}

// Responsive for social display
@media (max-width: 768px) {
  .social-display {
    top: 15px;
    right: 15px;
    gap: 6px;
    
    .social-item {
      padding: 6px 10px;
      
      .social-icon {
        width: 16px;
        height: 16px;
      }
      
      .social-text {
        font-size: 0.8rem;
      }
    }
  }
  
  .view-indicator {
    top: 10px;
    left: 15px;
    padding: 6px 12px;
    
    .view-info {
      .view-name {
        font-size: 0.9rem;
      }
      
      .view-shortcuts {
        font-size: 0.6rem;
      }
    }
  }
}
</style> 