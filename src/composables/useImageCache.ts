import { ref, computed } from 'vue'

interface CacheStatus {
  total: number
  cached: number
  failed: number
  percentage: number
  isComplete: boolean
}

interface ImageCacheItem {
  url: string
  cached: boolean
  error?: string
  timestamp?: number
}

export function useImageCache() {
  const cacheStatus = ref<CacheStatus>({
    total: 0,
    cached: 0,
    failed: 0,
    percentage: 0,
    isComplete: false
  })

  const isCaching = ref(false)
  const cacheVersion = ref('v1')
  const CACHE_NAME = 'shopify-product-images'

  // Check if Cache API is supported
  const isCacheSupported = computed(() => {
    return typeof window !== 'undefined' && 'caches' in window
  })

  // Check if image is cached
  const isImageCached = async (imageUrl: string): Promise<boolean> => {
    if (!isCacheSupported.value) return false
    
    try {
      const cache = await caches.open(CACHE_NAME)
      const response = await cache.match(imageUrl)
      return !!response
    } catch (error) {
      console.warn('Error checking cache:', error)
      return false
    }
  }

  // Cache a single image
  const cacheImage = async (imageUrl: string): Promise<boolean> => {
    if (!isCacheSupported.value) return false
    
    try {
      const cache = await caches.open(CACHE_NAME)
      
      // Check if already cached
      const existing = await cache.match(imageUrl)
      if (existing) {
        return true
      }

      // Fetch and cache the image
      const response = await fetch(imageUrl, {
        mode: 'cors',
        cache: 'default'
      })

      if (response.ok) {
        await cache.put(imageUrl, response.clone())
        return true
      } else {
        console.warn(`Failed to cache image: ${imageUrl} - ${response.status}`)
        return false
      }
    } catch (error) {
      console.warn(`Error caching image: ${imageUrl}`, error)
      return false
    }
  }

  // Cache multiple images with progress tracking
  const cacheImages = async (imageUrls: string[], concurrency: number = 3): Promise<void> => {
    if (!isCacheSupported.value) {
      console.warn('Cache API not supported')
      return
    }

    if (imageUrls.length === 0) return

    isCaching.value = true
    cacheStatus.value = {
      total: imageUrls.length,
      cached: 0,
      failed: 0,
      percentage: 0,
      isComplete: false
    }

    console.log(`🖼️ Starting to cache ${imageUrls.length} images...`)

    // Process images in chunks to avoid overwhelming the browser
    const chunks = []
    for (let i = 0; i < imageUrls.length; i += concurrency) {
      chunks.push(imageUrls.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (imageUrl) => {
        try {
          const success = await cacheImage(imageUrl)
          if (success) {
            cacheStatus.value.cached++
          } else {
            cacheStatus.value.failed++
          }
        } catch (error) {
          cacheStatus.value.failed++
          console.warn(`Failed to cache image: ${imageUrl}`, error)
        }

        // Update progress
        const completed = cacheStatus.value.cached + cacheStatus.value.failed
        cacheStatus.value.percentage = Math.round((completed / cacheStatus.value.total) * 100)
      })

      await Promise.all(promises)
      
      // Small delay between chunks to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    cacheStatus.value.isComplete = true
    isCaching.value = false

    console.log(`✅ Image caching complete: ${cacheStatus.value.cached} cached, ${cacheStatus.value.failed} failed`)
  }

  // Get cached image URL (returns original if not cached)
  const getCachedImageUrl = async (imageUrl: string): Promise<string> => {
    if (!isCacheSupported.value) return imageUrl
    
    try {
      const cache = await caches.open(CACHE_NAME)
      const response = await cache.match(imageUrl)
      
      if (response) {
        // Return the cached URL (creates a blob URL)
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      }
      
      return imageUrl
    } catch (error) {
      console.warn('Error getting cached image:', error)
      return imageUrl
    }
  }

  // Clear image cache
  const clearCache = async (): Promise<void> => {
    if (!isCacheSupported.value) return
    
    try {
      const success = await caches.delete(CACHE_NAME)
      if (success) {
        console.log('✅ Image cache cleared')
        cacheStatus.value = {
          total: 0,
          cached: 0,
          failed: 0,
          percentage: 0,
          isComplete: false
        }
      }
    } catch (error) {
      console.warn('Error clearing cache:', error)
    }
  }

  // Get cache info
  const getCacheInfo = async () => {
    if (!isCacheSupported.value) return null
    
    try {
      const cache = await caches.open(CACHE_NAME)
      const keys = await cache.keys()
      
      return {
        count: keys.length,
        urls: keys.map(req => req.url),
        size: 'unknown' // Browser doesn't provide size info
      }
    } catch (error) {
      console.warn('Error getting cache info:', error)
      return null
    }
  }

  // Auto-cache images from products
  const cacheProductImages = async (products: any[], options: { 
    includeAllImages?: boolean 
    concurrency?: number 
  } = {}) => {
    const { includeAllImages = false, concurrency = 3 } = options
    
    let imageUrls: string[] = []
    
    if (includeAllImages) {
      // Cache all product images
      products.forEach(product => {
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((image: any) => {
            if (image.src) {
              imageUrls.push(image.src)
            }
          })
        }
      })
    } else {
      // Cache only primary images
      products.forEach(product => {
        if (product.imageUrl) {
          imageUrls.push(product.imageUrl)
        }
      })
    }

    // Remove duplicates
    imageUrls = [...new Set(imageUrls)]
    
    console.log(`📦 Caching ${imageUrls.length} product images (includeAllImages: ${includeAllImages})`)
    
    await cacheImages(imageUrls, concurrency)
  }

  return {
    // State
    cacheStatus: computed(() => cacheStatus.value),
    isCaching: computed(() => isCaching.value),
    isCacheSupported,
    
    // Methods
    cacheImage,
    cacheImages,
    cacheProductImages,
    isImageCached,
    getCachedImageUrl,
    clearCache,
    getCacheInfo
  }
} 