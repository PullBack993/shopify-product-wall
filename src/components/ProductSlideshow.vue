<template>
  <main class="main-content">
    <!-- Loading State -->
    <LoadingState v-if="loading" />

    <!-- Error State -->
    <ErrorState v-else-if="error" :error="error" @retry="$emit('retry')" />
    
    <!-- Product Slideshow -->
    <div v-else class="slideshow-container">
      <transition 
        name="slide-fade" 
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <div 
          v-if="currentSlide"
          :key="currentSlide.id"
          class="slide"
          :data-image-id="currentSlide.id"
        >
          <div class="slide-background">
            <!-- Background Image Skeleton -->
            <div v-if="backgroundImageLoading" class="background-skeleton">
              <div class="skeleton-shimmer background"></div>
            </div>
            
            <img 
              :src="getBackgroundImageUrl(currentSlide.url)" 
              :alt="currentSlide.alt"
              class="background-image"
              :class="{ 'background-loaded': !backgroundImageLoading }"
              loading="lazy"
              @load="onBackgroundImageLoad"
              @error="onBackgroundImageError"
            />
            <div class="background-overlay"></div>
          </div>
          
          <div class="slide-content">
            <div class="product-showcase">
              <div class="product-image-container">
                <!-- Image Skeleton -->
                <div v-if="imageLoading" class="image-skeleton">
                  <div class="skeleton-shimmer"></div>
                </div>
                
                <img 
                  :src="getSlideshowImageUrl(currentSlide.url)" 
                  :alt="currentSlide.alt"
                  class="product-image"
                  :class="{ 'image-loaded': !imageLoading }"
                  loading="lazy"
                  @load="onImageLoad"
                  @error="onImageError"
                />
                
                <!-- Linear Gradient Overlay -->
                <div class="image-gradient-overlay"></div>
                
                <!-- Product Label Badge -->
                <div v-if="currentSlide?.label && !imageLoading" class="product-label" :class="`label-${currentSlide.label}`">
                  <span v-if="currentSlide?.label === 'sale'">🏷️ SALE</span>
                  <span v-else-if="currentSlide?.label === 'new'">✨ NEW</span>
                  <span v-else-if="currentSlide?.label === 'top-selling'">🔥 TOP</span>
                </div>
              </div>
              
              <div class="product-details">
                <h1 class="product-title">{{ currentSlide.text }}</h1>
                <p v-if="currentSlide.productType" class="product-type">{{ currentSlide.productType }}</p>
                <p v-if="currentSlide.price" class="product-price">€{{ currentSlide.price }}</p>
                
                <!-- QR Code -->
                <div class="qr-container">
                  <canvas 
                    ref="qrCanvas" 
                    class="qr-code"
                    width="120"
                    height="120"
                    :title="`QR Code for ${currentSlide.text}`"
                  ></canvas>
                  <span class="qr-label">Scan to view online</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Slide Indicator -->
          <div class="slide-indicator">
            <div class="slide-progress">
              <div 
                class="progress-bar" 
                :style="{ width: `${slideProgress}%` }"
              ></div>
            </div>
            <span class="slide-counter">
              {{ currentSlideIndex + 1 }} / {{ displayImages.length }}
            </span>
          </div>
        </div>
      </transition>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import QRCode from 'qrcode'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import type { GridImage } from '../types'
import { getSlideshowImageUrl, getBackgroundImageUrl } from '@/utils/imageUtils'

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

const currentSlideIndex = ref(0)
const slideProgress = ref(0)
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const imageLoading = ref(true)
const backgroundImageLoading = ref(true)

let slideInterval: ReturnType<typeof setInterval> | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

const slideDuration = import.meta.env.DEV ? 5000000 : 8000 // 5s in dev, 8s in production

// Current slide computed property
const currentSlide = computed(() => {
  if (props.displayImages.length === 0) return null
  return props.displayImages[currentSlideIndex.value] || null
})

// Generate QR code for current slide
const generateQRCode = async () => {
  await nextTick()
  
  // Wait for canvas to be available
  let attempts = 0
  const maxAttempts = 10
  
  while ((!qrCanvas.value || !currentSlide.value) && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  if (!qrCanvas.value || !currentSlide.value) {
    return
  }
  
  try {
    const canvas = qrCanvas.value
    
    if (!canvas) {
      return
    }
    
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      return
    }
    
    // Clear canvas first to prevent artifacts
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Generate QR code with current slide data
    const qrData = currentSlide.value.qrCodeData
    
    if (!qrData) {
      return
    }
    
    // Set canvas size explicitly
    canvas.width = 120
    canvas.height = 120
    
    await QRCode.toCanvas(canvas, qrData, {
      width: 120,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // Add logo to center after QR code is generated
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    
    logoImg.onload = () => {
      try {
        const logoSize = canvas.width * 0.2
        const logoX = (canvas.width - logoSize) / 2
        const logoY = (canvas.height - logoSize) / 2
        
        // White background circle
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 2, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw logo
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
      } catch (logoError) {
        console.error('Error adding logo to QR code:', logoError)
      }
    }
    
    logoImg.onerror = () => {
      // Logo could not be loaded, QR code will show without logo
    }
    
    logoImg.src = '/favicon.svg'
    
  } catch (error) {
    console.error('QR Code generation failed:', error)
    
    // Fallback: show a simple error message on canvas
    const canvas = qrCanvas.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#666'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('QR Error', canvas.width / 2, canvas.height / 2)
      }
    }
  }
}

// Start slideshow
const startSlideshow = () => {
  if (props.displayImages.length <= 1) return
  
  // Reset progress
  slideProgress.value = 0
  
  // Start slide timer
  if (slideInterval) {
    clearInterval(slideInterval)
  }
  
  slideInterval = setInterval(() => {
    nextSlide()
  }, slideDuration)
  
  // Start progress animation
  if (progressInterval) {
    clearInterval(progressInterval)
  }
  
  progressInterval = setInterval(() => {
    slideProgress.value += (100 / (slideDuration / 100))
    if (slideProgress.value >= 100) {
      slideProgress.value = 100
    }
  }, 100)
}

// Stop slideshow
const stopSlideshow = () => {
  if (slideInterval) {
    clearInterval(slideInterval)
    slideInterval = null
  }
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

// Image loading handlers
const onImageLoad = () => {
  imageLoading.value = false
}

const onImageError = () => {
  imageLoading.value = false
}

const onBackgroundImageLoad = () => {
  backgroundImageLoading.value = false
}

const onBackgroundImageError = () => {
  backgroundImageLoading.value = false
}

// Go to next slide
const nextSlide = () => {
  if (props.displayImages.length === 0) return
  
  const oldIndex = currentSlideIndex.value
  currentSlideIndex.value = (currentSlideIndex.value + 1) % props.displayImages.length
  slideProgress.value = 0
  
  // Reset loading state for new slide
  imageLoading.value = true
  backgroundImageLoading.value = true
  
  // Generate QR code for new slide with proper timing
  // Wait for DOM to update and transition to complete
  setTimeout(() => {
    generateQRCode()
  }, 200) // Increased delay to allow for transition completion
}

// Animation event handlers
const onBeforeEnter = (el: Element) => {
  ;(el as HTMLElement).style.opacity = '0'
  ;(el as HTMLElement).style.transform = 'translateX(50px)'
}

const onEnter = (el: Element) => {
  ;(el as HTMLElement).style.transition = 'all 0.6s ease-out'
  ;(el as HTMLElement).style.opacity = '1'
  ;(el as HTMLElement).style.transform = 'translateX(0)'
}

const onLeave = (el: Element) => {
  ;(el as HTMLElement).style.transition = 'all 0.4s ease-in'
  ;(el as HTMLElement).style.opacity = '0'
  ;(el as HTMLElement).style.transform = 'translateX(-50px)'
}

// Watch for images changes
watch(() => props.displayImages, (newImages) => {
  if (newImages.length > 0) {
    currentSlideIndex.value = 0
    imageLoading.value = true
    backgroundImageLoading.value = true
    stopSlideshow()
    
    nextTick(() => {
      setTimeout(() => {
        generateQRCode()
        startSlideshow()
      }, 200) // Reduced delay for faster startup
    })
  }
}, { immediate: true })

// Watch for current slide changes
watch(currentSlide, (newSlide) => {
  if (newSlide) {
    // Wait for slide transition to complete before generating QR code
    setTimeout(() => {
      generateQRCode()
    }, 1000) // Wait for transition to complete
  }
}, { flush: 'post' })

onMounted(() => {
  if (props.displayImages.length > 0) {
    nextTick(() => {
      generateQRCode()
      startSlideshow()
    })
  }
})

onUnmounted(() => {
  stopSlideshow()
})
</script>

<style lang="scss" scoped>
.main-content {
  flex: 1;
  width: 100%;
  height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: transparent;
  
  .slideshow-container {
    width: 100%;
    height: 100%;
    position: relative;
    
    .slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .slide-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        
        .background-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #e0e0e0;
          z-index: 20;
          
          .skeleton-shimmer.background {
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            animation: shimmer 2s infinite;
          }
        }
        
        .background-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(10px) brightness(0.8);
          transform: scale(1.1);
          transition: opacity 0.3s ease;
          opacity: 0;
          z-index: 1;
          
          &.background-loaded {
            opacity: 1;
          }
        }
        
        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.3) 50%,
            rgba(0, 0, 0, 0.6) 100%
          );
          z-index: 3;
        }
      }
      
      .slide-content {
        position: relative;
        z-index: 4;
        max-height: 100%;
        height: 100%;
        
        .product-showcase {
          display: flex;
          align-items: center;
          gap: 60px;
          height: 100%;
          
          .product-image-container {
            position: relative;
            flex-shrink: 0;
            height: 85%;
            margin-left: 1rem;
            width: 60vw;
            
            .image-skeleton {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: #f0f0f0;
              border-radius: 20px;
              overflow: hidden;
              z-index: 2;
              aspect-ratio: 1; // 1:1 aspect ratio to match slideshow images (600x600)
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
              
              .skeleton-shimmer {
                width: 100%;
                height: 100%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(255, 255, 255, 0.6),
                  transparent
                );
                animation: shimmer 1.5s infinite;
              }
            }
            
            .product-image {
              position: relative;
              z-index: 1;
              width: 100%;
              height: 100%;
              object-fit: cover;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
              transition: all 0.3s ease;
              opacity: 0;
              
              &.image-loaded {
                opacity: 1;
              }
              
             
            }
            
            .image-gradient-overlay {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 100%;
              background-image: linear-gradient(
                to top, 
                rgba(0, 0, 0, 0.9) 0%, 
                rgba(0, 0, 0, 0.6) 10%,
                rgba(0, 0, 0, 0.2) 20%,
                rgba(0, 0, 0, 0.1) 30%, 
                rgba(0, 0, 0, 0) 100%
              );
              border-radius: 20px;
              z-index: 3;
              pointer-events: none;
            }
            
            .product-label {
              position: absolute;
              top: 15px;
              right: 15px;
              padding: 8px 16px;
              border-radius: 25px;
              font-weight: 600;
              font-size: 0.9rem;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              z-index: 4;
              
              &.label-sale {
                background: linear-gradient(135deg, #FF6B6B, #FF8E53);
                color: white;
              }
              
              &.label-new {
                background: linear-gradient(135deg, #4ECDC4, #44A08D);
                color: white;
              }
              
              &.label-top-selling {
                background: linear-gradient(135deg, #FFD93D, #FF6B6B);
                color: white;
              }
            }
          }
          
          .product-details {
            flex: 1;
            color: white;
            
            .product-title {
              font-size: 3rem;
              font-weight: 700;
              margin-bottom: 20px;
              line-height: 1.2;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            }
            
            .product-type {
              font-size: 1.3rem;
              color: rgba(255, 255, 255, 0.8);
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            
            .product-price {
              font-size: 2.5rem;
              font-weight: 600;
              color: #4ECDC4;
              margin-bottom: 40px;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            }
            
            .qr-container {
              display: flex;
              align-items: center;
              gap: 20px;
              
              .qr-code {
                border-radius: 10px;
                background: white;
                padding: 10px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
              }
              
              .qr-label {
                font-size: 1.1rem;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
              }
            }
          }
        }
      }
      
      .slide-indicator {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        
        .slide-progress {
          width: 200px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          overflow: hidden;
          
          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #4ECDC4, #44A08D);
            border-radius: 2px;
            transition: width 0.1s linear;
          }
        }
        
        .slide-counter {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
        }
      }
    }
  }
}

// Slide transition animations
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.6s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

// Skeleton loading animations
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}



</style> 