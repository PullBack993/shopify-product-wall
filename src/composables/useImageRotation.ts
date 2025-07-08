import { ref, type Ref } from 'vue'
import type { GridImage } from '../types'

export function useImageRotation(gridImages: Ref<GridImage[]>) {
  const displayImages = ref<GridImage[]>([])
  const rotationQueue = ref<GridImage[]>([])
  const currentPosition = ref(0) // Which position to replace next
  const totalProductsShown = ref(0)
  const currentCycle = ref(1)
  
  // Track recently changed positions to prevent immediate re-selection
  const recentlyChanged = ref<Set<number>>(new Set())
  const cooldownPeriod = 3 // Number of rotations before position can be selected again
  const rotationHistory = ref<number[]>([]) // Track last few rotations for cooldown management
  
  let rotateInterval: ReturnType<typeof setInterval>
  
  console.log('🚀 useImageRotation composable initialized')
  console.log(`   • Grid images available: ${gridImages.value.length}`)

  // Initialize display images when gridImages loads
  const initializeDisplayImages = (maxDisplayImages: number) => {
    if (gridImages.value.length === 0) return
    
    // Calculate how many images to show on screen
    const displayCount = Math.min(maxDisplayImages, gridImages.value.length)
    
    // Take first N images for display
    displayImages.value = gridImages.value.slice(0, displayCount).map((img, index) => ({
      ...img,
      id: `${img.id}-display-${index}`
    }))
    
    // Put remaining images in rotation queue
    rotationQueue.value = gridImages.value.slice(displayCount).map(img => ({ ...img }))
    
    // Reset counters and cooldown tracking
    currentPosition.value = 0
    totalProductsShown.value = displayCount
    currentCycle.value = 1
    recentlyChanged.value.clear()
    rotationHistory.value = []
    
    console.log(`✅ SIMPLE ROTATION INITIALIZED:`)
    console.log(`   • Screen: ${displayCount} images`)
    console.log(`   • Queue: ${rotationQueue.value.length} images`)
    console.log(`   • Total: ${gridImages.value.length} images`)
    console.log(`   • Cooldown system: ${cooldownPeriod} rotations before position can be reselected`)
  }

  // Simple rotation: replace one image, put replaced image at end of queue
  const rotateNextImage = () => {
    console.log(`🔄 ROTATION ATTEMPT ${currentPosition.value + 1}:`)
    console.log(`   • Display images: ${displayImages.value.length}`)
    console.log(`   • Queue length: ${rotationQueue.value.length}`)
    
    if (displayImages.value.length === 0 || rotationQueue.value.length === 0) {
      console.log('⚠️ No images to rotate - stopping')
      return
    }
    
    // Get next image from front of queue
    const nextImage = rotationQueue.value.shift()!
    
    // Get RANDOM position to replace (excluding recently changed positions)
    const availablePositions = []
    for (let i = 0; i < displayImages.value.length; i++) {
      if (!recentlyChanged.value.has(i)) {
        availablePositions.push(i)
      }
    }
    
    // If no positions available, clear cooldown and use all positions
    if (availablePositions.length === 0) {
      console.log('   • All positions on cooldown, clearing cooldown')
      recentlyChanged.value.clear()
      for (let i = 0; i < displayImages.value.length; i++) {
        availablePositions.push(i)
      }
    }
    
    // Select random position from available positions
    const positionToReplace = availablePositions[Math.floor(Math.random() * availablePositions.length)]
    const oldImage = displayImages.value[positionToReplace]
    
    console.log(`   • Available positions: ${availablePositions.length}/${displayImages.value.length}`)
    console.log(`   • Recently changed positions: [${Array.from(recentlyChanged.value).join(', ')}]`)
    
    console.log(`   • Replacing position ${positionToReplace}`)
    console.log(`   • Old: "${oldImage.text}" (ID: ${oldImage.id})`)
    console.log(`   • New: "${nextImage.text}" (ID: ${nextImage.id})`)
    
    // Replace image at current position with completely new data
    const newImageData = {
      ...nextImage,
      id: `${nextImage.id}-rotation-${Date.now()}-${positionToReplace}`,
      // Force URL change to trigger reactivity
      url: `${nextImage.url}?t=${Date.now()}`
    }
    
    // Force Vue reactivity by using reactive assignment
    displayImages.value = displayImages.value.map((img, index) => 
      index === positionToReplace ? newImageData : img
    )
    
    console.log(`   • ✅ ARRAY UPDATED - Position ${positionToReplace} now has: "${newImageData.text}"`)
    console.log(`   • New ID: ${newImageData.id}`)
    console.log(`   • New URL: ${newImageData.url}`)
    
    // Put old image at end of queue (extract original data)
    const originalOldImage = {
      ...oldImage,
      id: oldImage.id.split('-display-')[0].split('-rotation-')[0],
      url: oldImage.url.split('?t=')[0] // Remove timestamp
    }
    rotationQueue.value.push(originalOldImage)
    
    console.log(`   • Old image "${originalOldImage.text}" moved to end of queue`)
    console.log(`   • Queue now has: ${rotationQueue.value.length} images`)
    
    // Add position to recently changed set and rotation history
    recentlyChanged.value.add(positionToReplace)
    rotationHistory.value.push(positionToReplace)
    
    // Remove positions from cooldown after cooldown period
    if (rotationHistory.value.length > cooldownPeriod) {
      const oldestPosition = rotationHistory.value.shift()!
      recentlyChanged.value.delete(oldestPosition)
      console.log(`   • Position ${oldestPosition} removed from cooldown`)
    }
    
    // Keep rotation history manageable
    if (rotationHistory.value.length > cooldownPeriod * 2) {
      rotationHistory.value = rotationHistory.value.slice(-cooldownPeriod)
    }
    
    // Track rotation count for cycle management
    currentPosition.value++
    
    // Every 20 rotations, increment cycle (roughly one full screen worth)
    if (currentPosition.value > 0 && currentPosition.value % 20 === 0) {
      currentCycle.value++
      console.log(`🎉 Completed ~20 random rotations - Cycle ${currentCycle.value}`)
    }
  }

  // Auto rotate for TV display
  const startAutoRotate = () => {
    // Stop existing interval if any
    if (rotateInterval) {
      clearInterval(rotateInterval)
      console.log('🛑 Stopped existing rotation interval')
    }
    
    const rotationIntervalMs = import.meta.env.DEV ? 2000 : 8000 // 2s in dev, 8s in production
    
    console.log(`🔄 Starting simple rotation every ${rotationIntervalMs / 1000}s`)
    console.log(`   • Display images: ${displayImages.value.length}`)
    console.log(`   • Queue length: ${rotationQueue.value.length}`)
    
    if (displayImages.value.length === 0 || rotationQueue.value.length === 0) {
      console.log('⚠️ Cannot start rotation - no images or empty queue')
      return
    }
    
    rotateInterval = setInterval(() => {
      console.log(`⏰ Auto-rotation timer fired`)
      rotateNextImage()
    }, rotationIntervalMs)
    
    console.log(`✅ Auto-rotation started with interval ID: ${rotateInterval}`)
  }

  const stopAutoRotate = () => {
    if (rotateInterval) {
      clearInterval(rotateInterval)
    }
  }

  // Shuffle images with animation
  const shuffleImages = async (maxDisplayImages: number) => {
    if (gridImages.value.length === 0) return
    
    try {
      // Reinitialize with fresh data
      initializeDisplayImages(maxDisplayImages)
      
      // Brief delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error shuffling images:', error)
    }
  }

  // Manual rotation for testing (spacebar in dev mode)
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.code === 'Space' && import.meta.env.DEV) {
      event.preventDefault()
      console.log('🔥 MANUAL ROTATION TRIGGERED (spacebar)')
      rotateNextImage()
    }
  }

  return {
    displayImages,
    rotationQueue,
    currentImageIndex: currentPosition, // For compatibility with footer
    totalProductsShown,
    currentCycle,
    initializeDisplayImages,
    rotateNextImage,
    startAutoRotate,
    stopAutoRotate,
    shuffleImages,
    handleKeyPress
  }
} 