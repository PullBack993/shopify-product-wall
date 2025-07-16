<template>
  <main class="main-content">
    <!-- Loading State -->
    <LoadingState v-if="loading" />

    <!-- Error State -->
    <ErrorState v-else-if="error" :error="error" @retry="$emit('retry')" />
    
    <!-- Vertical Marquee Grid -->
    <div 
      v-else
      class="marquee-container"
    >
      <div 
        v-for="columnIndex in numColumns"
        :key="`column-${columnIndex - 1}`"
        class="marquee-column"
        :class="{
          'column-even': (columnIndex - 1) % 2 === 0,
          'column-odd': (columnIndex - 1) % 2 === 1
        }"
        :style="{
          '--gap': `${gap}px`,
          '--animation-duration': `${getAnimationDuration(columnIndex - 1)}s`
        }"
      >
        <!-- First set of images -->
        <div class="marquee-content">
          <div
            v-for="(image, imageIndex) in getColumnImages(columnIndex - 1)"
            :key="`col-${columnIndex - 1}-img-${imageIndex}`"
            class="marquee-item"
            :style="{ marginBottom: `${gap}px` }"
          >
            <GridItem
              :image="image"
            />
          </div>
        </div>
        
        <!-- Duplicate set for seamless loop -->
        <div class="marquee-content" aria-hidden="true">
          <div
            v-for="(image, imageIndex) in getColumnImages(columnIndex - 1)"
            :key="`col-${columnIndex - 1}-img-duplicate-${imageIndex}`"
            class="marquee-item"
            :style="{ marginBottom: `${gap}px` }"
          >
            <GridItem
              :image="image"
            />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GridItem from './GridItem.vue'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import type { GridImage } from '../types'

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

// Group images by column based on columnIndex property
const getColumnImages = (columnIndex: number) => {
  return props.displayImages.filter(image => image.columnIndex === columnIndex)
}

// Get different animation durations for each column to create variation
const getAnimationDuration = (columnIndex: number) => {
  const baseDuration = 60 // Base duration in seconds
  const variation = (columnIndex % 3) * 5 // Add 0, 5, or 10 seconds variation
  return baseDuration + variation
}

// Calculate total columns with images
const getActiveColumns = computed(() => {
  if (props.displayImages.length === 0) return 0
  const maxColumnIndex = Math.max(...props.displayImages.map(img => img.columnIndex || 0))
  return maxColumnIndex + 1
})

// Debug logging
const logColumnDistribution = () => {
  console.log('📊 Marquee Column distribution:')
  const activeColumns = getActiveColumns.value
  for (let i = 0; i < activeColumns; i++) {
    const columnImages = getColumnImages(i)
    const direction = i % 2 === 0 ? 'up' : 'down'
    const duration = getAnimationDuration(i)
    console.log(`  Column ${i}: ${columnImages.length} images (${direction}, ${duration}s)`)
  }
}

// Log when images change
const totalImages = computed(() => props.displayImages.length)
let lastImageCount = 0

const checkForImageChanges = () => {
  if (totalImages.value !== lastImageCount) {
    lastImageCount = totalImages.value
    logColumnDistribution()
  }
}

// Call check on each render
checkForImageChanges()
</script>

<style lang="scss" scoped>
.main-content {
  flex: 1;
  padding: 5px 10px;
  width: 100%;
  height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: transparent;
  
  .marquee-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    gap: var(--gap, 10px);
    overflow: hidden;
    
    .marquee-column {
      flex: 1;
      height: 100%;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      
      .marquee-content {
        display: flex;
        flex-direction: column;
        
        .marquee-item {
          flex-shrink: 0;
          width: 100%;
        }
      }
      
      // Even columns: scroll up
      &.column-even {
        .marquee-content {
          animation: scrollUp var(--animation-duration, 20s) linear infinite;
        }
      }
      
      // Odd columns: scroll down
      &.column-odd {
        .marquee-content {
          animation: scrollDown var(--animation-duration, 25s) linear infinite;
        }
      }
    }
  }
}

// Keyframe animations for vertical scrolling
@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100%);
  }
}

@keyframes scrollDown {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
}


</style> 