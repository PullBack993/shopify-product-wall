<template>
  <div class="product-grid-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading products...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-text">{{ error }}</p>
      <button @click="$emit('refresh')" class="retry-button">
        Retry
      </button>
    </div>

    <!-- Products Grid -->
    <div v-else-if="displayedProducts.length > 0" class="product-grid" :class="{ 'rotating': isRotating }">
      <TransitionGroup name="product" tag="div" class="grid-container">
        <ProductCard
          v-for="product in displayedProducts"
          :key="product.id"
          :product="product"
          class="grid-item"
        />
      </TransitionGroup>
      
      <!-- Rotation Progress Bar -->
      <div v-if="availableProducts && availableProducts.length > gridSize" class="rotation-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${rotationProgress}%` }"
          ></div>
        </div>
        <div class="rotation-info">
          <div class="rotation-stats">
            <span class="displayed-count">{{ displayedProducts.length }}</span>
            <span class="separator">/</span>
            <span class="total-count">{{ availableProducts.length }}</span>
          </div>
          <div class="rotation-counter">
            {{ rotationCount }} rotations
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-container">
      <div class="empty-icon">📦</div>
      <p class="empty-text">No products available</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ProductCard from './ProductCard.vue'
import { useRotation } from '../composables/useRotation'

const props = defineProps({
  products: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['refresh'])

// Set up product rotation optimized for vertical TV displays
const {
  displayedProducts,
  availableProducts,
  rotationProgress,
  rotationCount,
  isRotating,
  gridSize
} = useRotation(computed(() => props.products), {
  gridSize: 15,              // Perfect for 3x5 grid on vertical TV
  rotationInterval: 1500,    // 1.5 seconds - fast and engaging
  shuffleOnStart: true
})
</script>

<style lang="scss" scoped>
.product-grid-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.loading-container,
.error-container,
.empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.loading-text,
.error-text,
.empty-text {
  font-size: 1.5rem;
  font-weight: 500;
  text-align: center;
  opacity: 0.8;
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  opacity: 0.6;
}

.retry-button {
  padding: 12px 24px;
  background: var(--accent-color);
  color: var(--text-primary);
  border: none;
  border-radius: var(--border-radius);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

.product-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: var(--transition);
  
  &.rotating {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.grid-container {
  display: grid;
  gap: 12px;
  padding: 15px;
  height: 100%;
  align-content: start;
  position: relative;
  
  /* Optimized for vertical TV displays (portrait orientation) */
  /* Default: Mobile/small screens */
  grid-template-columns: repeat(2, 1fr);
  
  /* Tablet portrait */
  @media (min-width: 768px) and (orientation: portrait) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  /* Large tablet/small TV portrait */
  @media (min-width: 1024px) and (orientation: portrait) {
    grid-template-columns: repeat(4, 1fr);
  }
  
  /* TV portrait (1080x1920) - Main target */
  @media (min-width: 1080px) and (orientation: portrait) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 25px;
  }
  
  /* Large vertical displays */
  @media (min-width: 1440px) and (orientation: portrait) {
    grid-template-columns: repeat(5, 1fr);
  }
  
  /* Landscape fallback */
  @media (orientation: landscape) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

.grid-item {
  break-inside: avoid;
  page-break-inside: avoid;
}

.rotation-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.rotation-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.9;
  white-space: nowrap;
}

.rotation-stats {
  display: flex;
  align-items: center;
  gap: 2px;
  
  .displayed-count {
    color: var(--accent-color);
    font-weight: 600;
  }
  
  .separator {
    opacity: 0.6;
    margin: 0 2px;
  }
  
  .total-count {
    opacity: 0.8;
  }
}

.rotation-counter {
  font-size: 0.75rem;
  opacity: 0.7;
  font-style: italic;
}

/* Smooth non-jumping transitions for vertical TV displays */
.product-enter-active {
  transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.product-leave-active {
  transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  /* Keep in normal flow to prevent jumping */
  position: relative;
  z-index: 0;
}

.product-enter-from {
  opacity: 0;
  transform: scale(0.8);
  filter: blur(4px);
}

.product-leave-to {
  opacity: 0;
  transform: scale(0.8);
  filter: blur(4px);
}

.product-move {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Enhanced grid items with attention-grabbing effects */
.grid-item {
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  /* Maintain consistent height to prevent jumping */
  display: flex;
  flex-direction: column;
  
  /* Subtle hover effect for interactivity */
  &:hover {
    transform: scale(1.03);
    z-index: 2;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  
  /* Pulse animation for newly entered items */
  &.product-enter-to {
    animation: newItemPulse 2s ease-out;
  }
}

/* Attention-grabbing pulse for new items */
@keyframes newItemPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 222, 128, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 222, 128, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 222, 128, 0);
  }
}

/* Smooth zoom-in effect for the entire grid on load */
.grid-container {
  animation: gridFadeIn 1s ease-out;
}

@keyframes gridFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive design */
@media (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 15px;
    padding: 15px;
  }
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    padding: 10px;
  }
}

/* Vertical orientation optimization */
@media (orientation: portrait) and (max-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
    padding: 25px;
  }
}
</style> 