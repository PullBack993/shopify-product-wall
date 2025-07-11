import { ref, computed, onMounted } from 'vue'
import type { Product, GridImage } from '@/types'

const CACHE_KEY = 'shopify-products-cache'
const CACHE_TIMESTAMP_KEY = 'shopify-products-cache-timestamp'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export function useProducts() {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  const lastUpdatedFormatted = computed(() => {
    if (!lastUpdated.value) return 'Never'
    return new Date(lastUpdated.value).toLocaleString()
  })

  // Convert products to grid images format
  const gridImages = computed<GridImage[]>(() => {
    return products.value.map((product) => ({
      id: product.id.toString(),
      url: product.localImageUrl,
      alt: product.imageAlt,
      text: product.title,
      qrCodeData: product.productUrl,
      aspectRatio: generateAspectRatio(),
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      productType: product.productType,
    }));
  })

  // Generate controlled aspect ratios for better visibility on TV
  const generateAspectRatio = (): number => {
    // Tighter range: 0.95 to 1.2 (ensures good height for all images)
    // This prevents very short images that are hard to see
    const ratios = [0.95, 1.0, 1.05, 1.1, 1.15, 1.2]
    return ratios[Math.floor(Math.random() * ratios.length)]
  }

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = (): boolean => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    if (!timestamp) return false
    
    const cacheAge = Date.now() - parseInt(timestamp)
    return cacheAge < CACHE_DURATION
  }

  /**
   * Get products from localStorage cache
   */
  const getCachedProducts = (): Product[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      
      if (cached && timestamp) {
        const parsedProducts = JSON.parse(cached)
        lastUpdated.value = new Date(parseInt(timestamp))
        return parsedProducts
      }
    } catch (error) {
      console.error('Error reading cached products:', error)
    }
    return null
  }

  /**
   * Save products to localStorage cache
   */
  const setCachedProducts = (productData: Product[]): void => {
    try {
      const timestamp = Date.now()
      localStorage.setItem(CACHE_KEY, JSON.stringify(productData))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())
      lastUpdated.value = new Date(timestamp)
    } catch (error) {
      console.error('Error caching products:', error)
    }
  }

  /**
   * Fetch products from local JSON file
   */
  const fetchFromLocal = async (): Promise<Product[]> => {
    try {
      const response = await fetch('/data/products.json', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Handle both formats: {products: [...]} and [...]
      if (Array.isArray(data)) {
        return data
      } else if (data.products && Array.isArray(data.products)) {
        return data.products
      } else {
        throw new Error('Invalid products data format')
      }
    } catch (error) {
      console.error('Error fetching from local file:', error)
      throw error
    }
  }

  /**
   * Fetch products from fallback JSON file
   */
  const fetchFromFallback = async (): Promise<Product[]> => {
    try {
      const response = await fetch('/data/products-simple.json')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching from fallback:', error)
      throw error
    }
  }

  /**
   * Load products with fallback strategy
   */
  const loadProducts = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      // Strategy 1: Try to fetch fresh data from local file
      try {
        const freshData = await fetchFromLocal()
        if (freshData && freshData.length > 0) {
          products.value = freshData
          setCachedProducts(freshData)
          console.log(`Loaded ${freshData.length} products from local file`)
          return
        }
      } catch (localError) {
        console.warn('Local file fetch failed, trying cache...')
      }

      // Strategy 2: Use cache if valid
      if (isCacheValid()) {
        const cachedData = getCachedProducts()
        if (cachedData && cachedData.length > 0) {
          products.value = cachedData
          console.log(`Loaded ${cachedData.length} products from cache`)
          return
        }
      }

      // Strategy 3: Use expired cache if available
      const cachedData = getCachedProducts()
      if (cachedData && cachedData.length > 0) {
        products.value = cachedData
        console.log(`Loaded ${cachedData.length} products from expired cache`)
        return
      }

      // Strategy 4: Use fallback data
      const fallbackData = await fetchFromFallback()
      if (fallbackData && fallbackData.length > 0) {
        products.value = fallbackData
        console.log(`Loaded ${fallbackData.length} products from fallback`)
        return
      }

      throw new Error('No product data available from any source')

    } catch (err: any) {
      error.value = err.message
      console.error('Error loading products:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh products - forces a fresh fetch
   */
  const refreshProducts = async (): Promise<void> => {
    console.log('Refreshing products...')
    await loadProducts()
  }

  /**
   * Clear cache
   */
  const clearCache = (): void => {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
    lastUpdated.value = null
  }

  // Initialize on mount
  onMounted(() => {
    loadProducts()
  })

  return {
    products,
    gridImages,
    loading,
    error,
    lastUpdated: lastUpdatedFormatted,
    refreshProducts,
    clearCache,
    isCacheValid
  }
} 