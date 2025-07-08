<template>
  <main class="main-content">
    <!-- Loading State -->
    <LoadingState v-if="loading" />

    <!-- Error State -->
    <ErrorState v-else-if="error" :error="error" @retry="$emit('retry')" />
    
    <!-- Pinterest Grid -->
    <div 
      v-else
      class="grid-container" 
      :style="{ 
        columnCount: numColumns,
        columnGap: `${gap}px`
      }"
    >
      <GridItem
        v-for="(image, index) in displayImages"
        :key="`position-${index}`"
        :image="image"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
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

defineProps<Props>()

defineEmits<{
  retry: []
}>()
</script>

<style lang="scss" scoped>
.main-content {
  flex: 1;
  padding: 5px 30px; /* Minimal top/bottom padding */
  width: 100%;
  height: 0; /* Allow flexbox to calculate height */
  overflow: hidden; /* Prevent content overflow */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  
  // Optimize for portrait TV layout
  .grid-container {
    width: 100%;
    max-width: none;
    height: 100%;
    column-fill: auto; /* Better top-to-bottom filling */
    overflow: hidden; /* Prevent grid overflow */
    padding: 0;
    margin: 0;
    
    // Ensure items stack properly in columns
    & > * {
      break-inside: avoid;
      display: inline-block;
      width: 100%;
      vertical-align: top;
      box-sizing: border-box;
    }
  }
}

@media (max-width: 1200px) {
  .main-content {
    padding: 25px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }
  
  .grid-container {
    column-gap: 20px;
  }
}
</style> 