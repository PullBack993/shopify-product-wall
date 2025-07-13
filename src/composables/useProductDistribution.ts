import { ref, computed, watch } from 'vue'
import type { Product, GridImage } from '@/types'
import type { ViewType } from './useViewManager'

export interface ViewProductConfig {
  viewId: ViewType
  productsPerView: number
  startIndex: number
  endIndex: number
  products: Product[]
}

function shuffleArray<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
  const arr = array.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function useProductDistribution() {
  const allProducts = ref<Product[]>([])
  const shuffledProducts = ref<Product[]>([])
  const currentCyclePosition = ref(0)
  const totalCycles = ref(0)
  
  // Configuration for how many products each view should show
  const viewConfigs = ref<Record<ViewType, number>>({
    'marquee': 20,    // Show 20 products in marquee view
    'grid': 15,       // Show 15 products in grid view  
    'slideshow': 15,  // Show 15 products in slideshow view
  })

  // Calculate total products needed per cycle
  const productsPerCycle = computed(() => {
    return Object.values(viewConfigs.value).reduce((sum, count) => sum + count, 0)
  })

  // Calculate category counts from all products
  const categoryCounts = computed(() => {
    const counts: Record<string, number> = {}
    
    allProducts.value.forEach(product => {
      const category = product.product_type || product.productType || 'Uncategorized'
      counts[category] = (counts[category] || 0) + 1
    })
    
    return counts
  })

  // Calculate view product distributions
  const viewDistributions = computed<Record<ViewType, ViewProductConfig>>(() => {
    const distributions: Record<ViewType, ViewProductConfig> = {} as any
    let currentIndex = currentCyclePosition.value
    
    // Distribute products across views from shuffledProducts
    for (const [viewId, productsCount] of Object.entries(viewConfigs.value)) {
      const startIndex = currentIndex
      const endIndex = currentIndex + productsCount
      
      // Get products for this view (with cycling)
      const viewProducts = getProductsForRange(startIndex, endIndex)
      
      distributions[viewId as ViewType] = {
        viewId: viewId as ViewType,
        productsPerView: productsCount,
        startIndex,
        endIndex,
        products: viewProducts
      }
      
      currentIndex = endIndex
    }
    
    return distributions
  })

  // Get products for a specific range with cycling and shuffling for small pools
  const getProductsForRange = (start: number, end: number): Product[] => {
    if (shuffledProducts.value.length === 0) return []
    
    const result: Product[] = []
    const totalProducts = shuffledProducts.value.length
    const productsNeeded = end - start
    
    for (let i = 0; i < productsNeeded; i++) {
      const baseIndex = (start + i) % totalProducts
      result.push(shuffledProducts.value[baseIndex])
    }
    
    return result
  }

  // Convert products to grid images format with column assignment
  const convertToGridImages = (products: Product[], viewId: ViewType = 'grid'): GridImage[] => {
    return products.map((product, index) => ({
      id: product.id.toString(),
      url: product.imageUrl, // Keep original URL - optimization happens in components
      alt: product.imageAlt,
      text: product.title,
      qrCodeData: product.productUrl,
      aspectRatio: generateAspectRatio(),
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      productType: product.product_type || product.productType, // Handle both field names
      // Add column index for marquee view
      columnIndex: viewId === 'marquee' ? index % 4 : undefined, // Distribute across 4 columns for marquee
    }))
  }

  // Generate controlled aspect ratios
  const generateAspectRatio = (): number => {
    const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth
    
    if (isPortrait) {
      const portraitRatios = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
      return portraitRatios[Math.floor(Math.random() * portraitRatios.length)]
    } else {
      const landscapeRatios = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1]
      return landscapeRatios[Math.floor(Math.random() * landscapeRatios.length)]
    }
  }

  // Get products for a specific view
  const getProductsForView = (viewId: ViewType): Product[] => {
    return viewDistributions.value[viewId]?.products || []
  }

  // Get grid images for a specific view
  const getGridImagesForView = (viewId: ViewType): GridImage[] => {
    const products = getProductsForView(viewId)
    const gridImages = convertToGridImages(products, viewId)
    
    return gridImages
  }

  // Move to next cycle (when all views have been shown)
  const moveToNextCycle = () => {
    const nextPosition = currentCyclePosition.value + productsPerCycle.value
    
    if (nextPosition >= shuffledProducts.value.length) {
      // Reset to beginning if we've shown all products
      currentCyclePosition.value = 0
      totalCycles.value++
      // Reshuffle for the new cycle
      shuffledProducts.value = shuffleArray(allProducts.value)
    } else {
      currentCyclePosition.value = nextPosition
    }
  }

  // Move to next view's products
  const moveToNextViewProducts = (fromViewId: ViewType) => {
    // Get the actual view order from the view manager
    const viewOrder: ViewType[] = ['marquee', 'grid', 'slideshow']
    const currentViewIndex = viewOrder.indexOf(fromViewId)
    
    // Only advance position when completing a full cycle
    const isCompletingCycle = currentViewIndex === viewOrder.length - 1
    
    if (isCompletingCycle) {
      moveToNextCycle()
    }
  }

  // Set all products (called when products are loaded)
  const setAllProducts = (products: Product[]) => {
    allProducts.value = products
    shuffledProducts.value = shuffleArray(products)
    currentCyclePosition.value = 0
    totalCycles.value = 1
    
    // Log essential product statistics
    console.log(`📊 PRODUCT DISTRIBUTION: Loaded ${products.length} products`)
    console.log(`📊 PRODUCT DISTRIBUTION: Products per cycle: ${productsPerCycle.value}`)
    console.log(`📊 PRODUCT DISTRIBUTION: Total cycles possible: ${Math.ceil(products.length / productsPerCycle.value)}`)
  }

  // Update view configuration
  const updateViewConfig = (viewId: ViewType, productCount: number) => {
    viewConfigs.value[viewId] = productCount
  }

  // Get current cycle info
  const getCurrentCycleInfo = () => {
    return {
      currentCycle: totalCycles.value,
      position: currentCyclePosition.value,
      total: allProducts.value.length,
      productsPerCycle: productsPerCycle.value,
      progress: allProducts.value.length > 0 ? (currentCyclePosition.value / allProducts.value.length) * 100 : 0
    }
  }

  // Reset to beginning
  const resetToBeginning = () => {
    currentCyclePosition.value = 0
    totalCycles.value = 1
    shuffledProducts.value = shuffleArray(allProducts.value)
  }

  return {
    // State
    allProducts,
    shuffledProducts,
    viewConfigs,
    viewDistributions,
    categoryCounts,
    
    // Methods
    setAllProducts,
    getProductsForView,
    getGridImagesForView,
    moveToNextCycle,
    moveToNextViewProducts,
    updateViewConfig,
    getCurrentCycleInfo,
    resetToBeginning,
    
    // Computed
    productsPerCycle,
  }
} 