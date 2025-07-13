import { ref, computed } from 'vue'

export type ViewType = 'marquee' | 'grid' | 'slideshow'

export interface ViewConfig {
  id: ViewType
  name: string
  description: string
  component: string
  autoSwitchDelay?: number // milliseconds
  productsPerView: number
}

export const AVAILABLE_VIEWS: ViewConfig[] = [
  {
    id: 'marquee',
    name: 'Vertical Marquee',
    description: 'Scrolling columns with alternating directions',
    component: 'ProductGrid',
    productsPerView: 20,
    autoSwitchDelay: 20000 // 20 seconds (20 products × 1 second each)
  },
  {
    id: 'grid',
    name: 'Vertical Grid',
    description: 'Traditional grid layout with smart rotation',
    component: 'VerticalGrid',
    productsPerView: 15,
    autoSwitchDelay: 22500 // 22.5 seconds (15 products × 1.5 seconds each)
  },
  {
    id: 'slideshow',
    name: 'Product Slideshow',
    description: 'Full-screen product showcase',
    component: 'ProductSlideshow',
    productsPerView: 15,
    autoSwitchDelay: 37500 // 37.5 seconds (15 products × 2.5 seconds each)
  }
]

export function useViewManager() {
  const currentViewIndex = ref(0)
  const autoSwitchEnabled = ref(true)
  const lastSwitchTime = ref(Date.now())
  const productStats = ref({
    totalProducts: 0,
    categoryCounts: {} as Record<string, number>,
    currentViewProducts: 0
  })
  
  let autoSwitchInterval: ReturnType<typeof setInterval> | null = null

  // Current view computed property
  const currentView = computed(() => AVAILABLE_VIEWS[currentViewIndex.value])
  
  // Get next view
  const getNextView = () => {
    const nextIndex = (currentViewIndex.value + 1) % AVAILABLE_VIEWS.length
    return AVAILABLE_VIEWS[nextIndex]
  }
  
  // Get previous view
  const getPreviousView = () => {
    const prevIndex = currentViewIndex.value === 0 
      ? AVAILABLE_VIEWS.length - 1 
      : currentViewIndex.value - 1
    return AVAILABLE_VIEWS[prevIndex]
  }
  
  // Update product statistics
  const updateProductStats = (totalProducts: number, products: any[], categoryCounts: Record<string, number>) => {
    productStats.value = {
      totalProducts,
      categoryCounts,
      currentViewProducts: products.length
    }
    
    // Log product statistics
    console.log(`📊 PRODUCT STATISTICS:`)
    console.log(`   • Total Products: ${totalProducts}`)
    console.log(`   • Current View Products: ${products.length}`)
   
  }
  
  // Switch to next view
  const switchToNextView = () => {
    currentViewIndex.value = (currentViewIndex.value + 1) % AVAILABLE_VIEWS.length
    lastSwitchTime.value = Date.now()
    
    // Emit event for product distribution management
    document.dispatchEvent(new CustomEvent('viewSwitched', {
      detail: { 
        fromView: AVAILABLE_VIEWS[currentViewIndex.value === 0 ? AVAILABLE_VIEWS.length - 1 : currentViewIndex.value - 1].id, 
        toView: currentView.value.id 
      }
    }))
    
    // Reset auto-switch timer
    if (autoSwitchEnabled.value) {
      startAutoSwitch()
    }
  }
  
  // Switch to previous view
  const switchToPreviousView = () => {
    currentViewIndex.value = currentViewIndex.value === 0 
      ? AVAILABLE_VIEWS.length - 1 
      : currentViewIndex.value - 1
    lastSwitchTime.value = Date.now()
    
    // Reset auto-switch timer
    if (autoSwitchEnabled.value) {
      startAutoSwitch()
    }
  }
  
  // Switch to specific view
  const switchToView = (viewId: ViewType) => {
    const viewIndex = AVAILABLE_VIEWS.findIndex(view => view.id === viewId)
    if (viewIndex !== -1 && viewIndex !== currentViewIndex.value) {
      currentViewIndex.value = viewIndex
      lastSwitchTime.value = Date.now()
      
      // Reset auto-switch timer
      if (autoSwitchEnabled.value) {
        startAutoSwitch()
      }
    }
  }
  
  // Start auto-switching
  const startAutoSwitch = () => {
    if (autoSwitchInterval) {
      clearInterval(autoSwitchInterval)
    }
    
    if (!autoSwitchEnabled.value) return
    
    const currentDelay = currentView.value.autoSwitchDelay || 20000
    
    autoSwitchInterval = setInterval(() => {
      switchToNextView()
    }, currentDelay)
  }
  
  // Stop auto-switching
  const stopAutoSwitch = () => {
    if (autoSwitchInterval) {
      clearInterval(autoSwitchInterval)
      autoSwitchInterval = null
    }
  }
  
  // Toggle auto-switch
  const toggleAutoSwitch = () => {
    autoSwitchEnabled.value = !autoSwitchEnabled.value
    
    if (autoSwitchEnabled.value) {
      startAutoSwitch()
    } else {
      stopAutoSwitch()
    }
  }
  
  // Get time since last switch
  const getTimeSinceLastSwitch = () => {
    return Date.now() - lastSwitchTime.value
  }
  
  // Get time until next auto-switch
  const getTimeUntilNextSwitch = () => {
    if (!autoSwitchEnabled.value) return null
    
    const elapsed = getTimeSinceLastSwitch()
    const delay = currentView.value.autoSwitchDelay || 20000
    return Math.max(0, delay - elapsed)
  }
  
  // Handle keyboard shortcuts for view switching
  const handleKeyPress = (event: KeyboardEvent) => {
    // Only in dev mode or specific conditions
    if (!import.meta.env.DEV) return
    
    switch (event.key) {
      case 'ArrowRight':
      case 'n':
      case 'N':
        event.preventDefault()
        switchToNextView()
        break
        
      case 'ArrowLeft':
      case 'p':
      case 'P':
        event.preventDefault()
        switchToPreviousView()
        break
        
      case '1':
        event.preventDefault()
        switchToView('marquee')
        break
        
      case '2':
        event.preventDefault()
        switchToView('grid')
        break
        
      case '3':
        event.preventDefault()
        switchToView('slideshow')
        break
        
      case 'a':
      case 'A':
        event.preventDefault()
        toggleAutoSwitch()
        break
    }
  }
  
  // Initialize with auto-switch enabled
  const initialize = () => {
    if (autoSwitchEnabled.value) {
      startAutoSwitch()
    }
  }
  
  // Cleanup
  const cleanup = () => {
    stopAutoSwitch()
  }

  return {
    // State
    currentView,
    currentViewIndex,
    autoSwitchEnabled,
    availableViews: AVAILABLE_VIEWS,
    productStats,
    
    // Navigation
    switchToNextView,
    switchToPreviousView,
    switchToView,
    getNextView,
    getPreviousView,
    
    // Auto-switch
    startAutoSwitch,
    stopAutoSwitch,
    toggleAutoSwitch,
    
    // Timing
    getTimeSinceLastSwitch,
    getTimeUntilNextSwitch,
    
    // Product statistics
    updateProductStats,
    
    // Utilities
    handleKeyPress,
    initialize,
    cleanup
  }
} 