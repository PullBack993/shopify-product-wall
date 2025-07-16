<template>
  <main class="main-content">
    <!-- Loading State -->
    <LoadingState v-if="loading" />

    <!-- Error State -->
    <ErrorState v-else-if="error" :error="error" @retry="$emit('retry')" />
    
    <!-- Dynamic Mosaic Grid -->
    <div v-else class="mosaic-container">
      <div
        v-for="(item, index) in mosaicItems"
        :key="item.image.id"
        class="mosaic-item"
        :class="`size-${item.size}`"
        :data-image-id="item.image.id"
        :style="{
          '--animation-delay': `${(index % 12) * 0.15}s`,
          '--x': item.position.x,
          '--y': item.position.y,
          '--rotation': `${item.rotation}deg`
        }"
      >
        <div class="mosaic-card">
          <div class="image-container">
            <img 
              :src="getMosaicImageUrl(item.image.url, item.size)" 
              :alt="item.image.alt"
              class="mosaic-image"
              loading="lazy"
              @load="onImageLoad"
            />
            
            <!-- Product Label Badge -->
            <div v-if="item.image?.label" class="product-label" :class="`label-${item.image.label}`">
              <span v-if="item.image?.label === 'sale'">🏷️</span>
              <span v-else-if="item.image?.label === 'new'">✨</span>
              <span v-else-if="item.image?.label === 'top-selling'">🔥</span>
            </div>
            
            <!-- Overlay for larger items -->
            <div v-if="item.size === 'large'" class="overlay">
              <div class="product-info">
                <h3 class="product-title">{{ item.image.text }}</h3>
                <p v-if="item.image.price" class="product-price">€{{ item.image.price }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import type { GridImage } from '../types'
import { getMosaicImageUrl } from '@/utils/imageUtils'

interface Props {
  loading: boolean
  error: string | null
  displayImages: GridImage[]
  numColumns: number
  gap: number
}

interface MosaicItem {
  image: GridImage
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number }
  rotation: number
  animationDelay: number
}

const props = defineProps<Props>()

defineEmits<{
  retry: []
}>()

const mosaicItems = ref<MosaicItem[]>([])
const containerRef = ref<HTMLElement>()

let reshuffleInterval: ReturnType<typeof setInterval> | null = null
let animationFrameId: number | null = null

const reshuffleDuration = import.meta.env.DEV ? 8000 : 12000 // 8s in dev, 12s in production

// Create mosaic layout from images
const createMosaicLayout = () => {
  if (props.displayImages.length === 0) return

  const items: MosaicItem[] = []
  const sizePatterns = [
    'small', 'medium', 'small', 'large', 'small', 'small',
    'medium', 'small', 'small', 'medium', 'large', 'small'
  ]

  props.displayImages.forEach((image, index) => {
    const sizeIndex = index % sizePatterns.length
    const size = sizePatterns[sizeIndex] as 'small' | 'medium' | 'large'
    
    // Create organic positioning
    const baseX = (index % 8) * 12.5 // 8 columns
    const baseY = Math.floor(index / 8) * 15 // Row height
    
    // Add some randomness for organic feel
    const randomX = (Math.random() - 0.5) * 3
    const randomY = (Math.random() - 0.5) * 3
    
    items.push({
      image: {
        ...image,
        id: `${image.id}-mosaic-${index}`
      },
      size,
      position: {
        x: baseX + randomX,
        y: baseY + randomY
      },
      rotation: (Math.random() - 0.5) * 6, // ±3 degrees
      animationDelay: (index % 12) * 150
    })
  })

  mosaicItems.value = items
  
  console.log(`🎨 Mosaic layout created with ${items.length} items`)
  console.log(`   • Small: ${items.filter(i => i.size === 'small').length}`)
  console.log(`   • Medium: ${items.filter(i => i.size === 'medium').length}`)
  console.log(`   • Large: ${items.filter(i => i.size === 'large').length}`)
}

// Shuffle mosaic with new positions and rotations
const shuffleMosaic = () => {
  if (mosaicItems.value.length === 0) return

  console.log(`🔄 Mosaic shuffle initiated`)

  // Create new randomized positions and rotations
  mosaicItems.value = mosaicItems.value.map((item, index) => {
    const baseX = (index % 8) * 12.5
    const baseY = Math.floor(index / 8) * 15
    const randomX = (Math.random() - 0.5) * 4
    const randomY = (Math.random() - 0.5) * 4

    return {
      ...item,
      position: {
        x: baseX + randomX,
        y: baseY + randomY
      },
      rotation: (Math.random() - 0.5) * 8,
      animationDelay: (index % 12) * 100
    }
  })

  console.log(`✅ Mosaic shuffled with new positions`)
}

// Animate items floating
const animateFloating = () => {
  const time = Date.now() * 0.001 // Convert to seconds
  
  mosaicItems.value = mosaicItems.value.map((item, index) => {
    const floatX = Math.sin(time * 0.3 + index * 0.5) * 0.5
    const floatY = Math.cos(time * 0.2 + index * 0.3) * 0.3
    
    return {
      ...item,
      position: {
        x: item.position.x + floatX,
        y: item.position.y + floatY
      }
    }
  })

  animationFrameId = requestAnimationFrame(animateFloating)
}

// Start mosaic animations
const startMosaicAnimations = () => {
  // Start reshuffling
  if (reshuffleInterval) {
    clearInterval(reshuffleInterval)
  }

  reshuffleInterval = setInterval(() => {
    shuffleMosaic()
  }, reshuffleDuration)

  // Start floating animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animateFloating()

  console.log(`🎨 Mosaic animations started`)
  console.log(`   • Reshuffle every: ${reshuffleDuration / 1000}s`)
  console.log(`   • Floating animation: active`)
}

// Stop mosaic animations
const stopMosaicAnimations = () => {
  if (reshuffleInterval) {
    clearInterval(reshuffleInterval)
    reshuffleInterval = null
  }
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Handle image load for staggered animations
const onImageLoad = () => {
  // Could add individual image load effects here
}

// Watch for images changes
watch(() => props.displayImages, (newImages) => {
  if (newImages.length > 0) {
    stopMosaicAnimations()
    createMosaicLayout()
    
    setTimeout(() => {
      startMosaicAnimations()
    }, 1000)
  }
}, { immediate: true })

onMounted(() => {
  if (props.displayImages.length > 0) {
    createMosaicLayout()
    startMosaicAnimations()
  }
})

onUnmounted(() => {
  stopMosaicAnimations()
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
  
  .mosaic-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    
    .mosaic-item {
      position: absolute;
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      animation: mosaicAppear 1s ease-out both;
      animation-delay: var(--animation-delay, 0s);
      
      // Dynamic positioning
      left: calc(var(--x) * 1%);
      top: calc(var(--y) * 1%);
      transform: rotate(var(--rotation));
      
      &:hover {
        z-index: 100;
        transform: rotate(var(--rotation)) scale(1.05);
        
        .mosaic-card {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
      }
      
      // Size variations
      &.size-small {
        width: 120px;
        height: 120px;
      }
      
      &.size-medium {
        width: 180px;
        height: 180px;
      }
      
      &.size-large {
        width: 260px;
        height: 260px;
      }
      
      .mosaic-card {
        width: 100%;
        height: 100%;
        border-radius: 16px;
        overflow: hidden;
        background: var(--shopify-bg-scheme-6);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        
        .image-container {
          position: relative;
          width: 100%;
          height: 100%;
          
          .mosaic-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }
          
          .product-label {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            
            &.label-sale {
              background: linear-gradient(135deg, #FF6B6B, #FF8E53);
            }
            
            &.label-new {
              background: linear-gradient(135deg, #4ECDC4, #44A08D);
            }
            
            &.label-top-selling {
              background: linear-gradient(135deg, #FFD93D, #FF6B6B);
            }
          }
          
          .overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
            padding: 20px 15px 15px;
            opacity: 0;
            transition: opacity 0.3s ease;
            
            .product-info {
              color: white;
              
              .product-title {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 5px;
                line-height: 1.3;
              }
              
              .product-price {
                font-size: 1.2rem;
                font-weight: 700;
                color: #4ECDC4;
              }
            }
          }
        }
        
        &:hover {
          .mosaic-image {
            transform: scale(1.1);
          }
          
          .overlay {
            opacity: 1;
          }
        }
      }
    }
  }
}

// Entrance animation
@keyframes mosaicAppear {
  0% {
    opacity: 0;
    transform: rotate(var(--rotation)) scale(0.3) translateY(50px);
  }
  100% {
    opacity: 1;
    transform: rotate(var(--rotation)) scale(1) translateY(0);
  }
}


</style> 