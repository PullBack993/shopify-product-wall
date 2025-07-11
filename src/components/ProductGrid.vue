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
        :color-scheme="index % 2 === 0 ? 'scheme-6' : 'scheme-3'"
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
  padding: 5px 10px; /* Minimal top/bottom padding */
  width: 100%;
  height: 0; /* Allow flexbox to calculate height */
  overflow: hidden; /* Prevent content overflow */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: transparent; /* Let the app background show through */
  
  // Optimize for portrait TV layout
  .grid-container {
    width: 100%;
    max-width: none;
    flex: 1; /* Take all available space */
    height: 100%;
    min-height: 100%; /* Ensure minimum height */
    column-fill: auto; /* Fill columns top to bottom first */
    overflow: hidden; /* Prevent grid overflow */
    padding: 0;
    margin: 0;
    
    // Ensure maximum space utilization
    display: block;
    box-sizing: border-box;
    
    // Force items to fill available space efficiently
    & > * {
      break-inside: avoid;
      display: inline-block;
      width: 100%;
      vertical-align: top;
      box-sizing: border-box;
      margin-bottom: 4px; /* Match GridItem margin */
      
      // Ensure last item in each column can stretch if needed
      &:last-of-type {
        margin-bottom: 0;
      }
    }
    
    // Aggressive space filling - make items slightly taller if needed
    &::after {
      content: '';
      display: block;
      height: 0;
      clear: both;
      visibility: hidden;
    }
  }
}


</style> 