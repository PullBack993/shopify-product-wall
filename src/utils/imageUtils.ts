/**
 * Shopify Image Optimization Utilities
 * 
 * Shopify CDN supports URL parameters for image resizing:
 * - &width=number - Resize to specific width
 * - &height=number - Resize to specific height
 * - &crop=center - Crop from center
 * - &format=webp - Convert to WebP format
 */

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'xlarge' | 'slideshow' | 'background'

export interface ImageSizeConfig {
  width: number
  height?: number
  crop?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  format?: 'webp' | 'jpg' | 'png'
}

// Predefined size configurations optimized for different use cases
export const IMAGE_SIZES: Record<ImageSize, ImageSizeConfig> = {
  thumbnail: { width: 150 },
  small: { width: 300 },
  medium: { width: 500 },
  large: { width: 800 },
  xlarge: { width: 1200 },
  slideshow: { width: 600, height: 600, crop: 'center' },
  background: { width: 1920, height: 1080, crop: 'center' }
}

/**
 * Check if URL is a Shopify CDN URL
 */
export function isShopifyImageUrl(url: string): boolean {
  return url.includes('cdn.shopify.com')
}

/**
 * Optimize Shopify image URL with size parameters
 */
export function optimizeShopifyImage(url: string, size: ImageSize | ImageSizeConfig): string {
  if (!isShopifyImageUrl(url)) {
    return url
  }

  const config = typeof size === 'string' ? IMAGE_SIZES[size] : size
  const urlObj = new URL(url)
  
  // Add width parameter
  urlObj.searchParams.set('width', config.width.toString())
  
  // Add height parameter if specified
  if (config.height) {
    urlObj.searchParams.set('height', config.height.toString())
  }
  
  // Add crop parameter if specified
  if (config.crop) {
    urlObj.searchParams.set('crop', config.crop)
  }
  
  // Add format parameter if specified
  if (config.format) {
    urlObj.searchParams.set('format', config.format)
  }
  
  return urlObj.toString()
}

/**
 * Get optimized image URL for grid items
 */
export function getGridImageUrl(url: string, containerWidth?: number): string {
  // Use container width if provided, otherwise use medium size
  const size = containerWidth ? { width: Math.min(containerWidth, 500) } : 'medium'
  return optimizeShopifyImage(url, size)
}

/**
 * Get optimized image URL for slideshow
 */
export function getSlideshowImageUrl(url: string): string {
  return optimizeShopifyImage(url, 'slideshow')
}

/**
 * Get optimized image URL for mosaic with dynamic sizing
 */
export function getMosaicImageUrl(url: string, itemSize: 'small' | 'medium' | 'large'): string {
  const sizeMap = {
    small: 'small' as ImageSize,
    medium: 'medium' as ImageSize,
    large: 'large' as ImageSize
  }
  return optimizeShopifyImage(url, sizeMap[itemSize])
}

/**
 * Get optimized background image URL
 */
export function getBackgroundImageUrl(url: string): string {
  return optimizeShopifyImage(url, 'background')
}

/**
 * Get responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(url: string): {
  small: string
  medium: string
  large: string
  xlarge: string
} {
  return {
    small: optimizeShopifyImage(url, 'small'),
    medium: optimizeShopifyImage(url, 'medium'),
    large: optimizeShopifyImage(url, 'large'),
    xlarge: optimizeShopifyImage(url, 'xlarge')
  }
}

/**
 * Generate srcset string for responsive images
 */
export function generateSrcSet(url: string): string {
  const responsive = getResponsiveImageUrls(url)
  return [
    `${responsive.small} 300w`,
    `${responsive.medium} 500w`,
    `${responsive.large} 800w`,
    `${responsive.xlarge} 1200w`
  ].join(', ')
}

/**
 * Calculate optimal image width based on container and device pixel ratio
 */
export function calculateOptimalWidth(containerWidth: number, devicePixelRatio = 1): number {
  return Math.ceil(containerWidth * devicePixelRatio)
}

/**
 * Calculate image height based on aspect ratio and column width
 */
export function calculateImageHeight(aspectRatio: number, columnWidth: number): number {
  return Math.round(columnWidth / aspectRatio)
} 