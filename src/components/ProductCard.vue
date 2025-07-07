<template>
  <div class="product-card" :class="{ 'loading': imageLoading }">
    <!-- Product Image Container -->
    <div class="image-container">
      <img 
        :src="optimizedImageUrl" 
        :alt="product.title"
        @load="onImageLoad"
        @error="onImageError"
        class="product-image"
        loading="lazy"
      />
      
      <!-- Image Loading Placeholder -->
      <div v-if="imageLoading" class="image-placeholder">
        <div class="placeholder-shimmer"></div>
      </div>
      
      <!-- Image Error Placeholder -->
      <div v-if="imageError" class="image-error">
        <div class="error-icon">🖼️</div>
        <p class="error-text">Image not available</p>
      </div>
      
      <!-- Price Badge -->
      <div v-if="product.price" class="price-badge">
        {{ formattedPrice }}
      </div>
      
      <!-- QR Code Overlay - Bottom Right -->
      <div class="qr-overlay">
        <qrcode-vue
          :value="product.productUrl"
          :size="80"
          :background="qrBackground"
          :foreground="qrForeground"
          level="M"
          class="qr-code"
        />
      </div>
    </div>
    
    <!-- Minimal Product Info -->
    <div class="product-info">
      <h3 class="product-title">{{ product.title }}</h3>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import QrcodeVue from 'qrcode.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const imageLoading = ref(true)
const imageError = ref(false)

// QR Code styling
const qrBackground = '#ffffff'
const qrForeground = '#000000'

// Computed properties
const optimizedImageUrl = computed(() => {
  // Check if we have a local optimized image first
  if (props.product.localImageUrl) {
    return props.product.localImageUrl
  }
  
  // Fallback to Shopify image with optimization parameters
  if (props.product.imageUrl) {
    const url = new URL(props.product.imageUrl)
    // Add Shopify image transformation parameters
    url.searchParams.set('width', '400')
    url.searchParams.set('height', '400')
    url.searchParams.set('crop', 'center')
    return url.toString()
  }
  
  return '/placeholder-image.jpg'
})

const formattedPrice = computed(() => {
  if (!props.product.price) return ''
  
  // Handle different price formats
  const price = parseFloat(props.product.price)
  if (isNaN(price)) return props.product.price
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
})

// Image loading handlers
const onImageLoad = () => {
  imageLoading.value = false
  imageError.value = false
}

const onImageError = () => {
  imageLoading.value = false
  imageError.value = true
  console.warn(`Failed to load image for product: ${props.product.title}`)
}

// Preload image on mount for better performance
onMounted(() => {
  if (optimizedImageUrl.value) {
    const img = new Image()
    img.onload = onImageLoad
    img.onerror = onImageError
    img.src = optimizedImageUrl.value
  }
})
</script>

<style lang="scss" scoped>
.product-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.25);
  animation: fadeIn 0.8s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.loading {
    .image-container {
      position: relative;
      overflow: hidden;
    }
  }
}

.image-container {
  position: relative;
  /* Take up most of the card - 80% */
  height: 80%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition);
  
  &:hover {
    transform: scale(1.05);
  }
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.image-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  .error-icon {
    font-size: 2rem;
    opacity: 0.5;
  }
  
  .error-text {
    font-size: 0.9rem;
    opacity: 0.7;
    text-align: center;
  }
}

.price-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 8px 16px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  animation: priceGlow 2s ease-in-out infinite alternate;
}

@keyframes priceGlow {
  0% { box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); }
  100% { box-shadow: 0 4px 25px rgba(245, 158, 11, 0.6); }
}

.product-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 20%;
  text-align: center;
}

.product-title {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  
  // Clamp title to 2 lines
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.qr-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 1);
  }
}

.qr-code {
  display: block;
}

/* Removed product-meta section for cleaner look */

/* Responsive adjustments */
@media (max-width: 768px) {
  .product-info {
    padding: 10px;
  }
  
  .product-title {
    font-size: 1.1rem;
  }
  
  .qr-overlay {
    bottom: 8px;
    right: 8px;
    padding: 4px;
  }
  
  .price-badge {
    font-size: 1rem;
    padding: 6px 12px;
  }
}

/* Vertical TV display optimization (1080x1920) */
@media (orientation: portrait) and (min-width: 1080px) {
  .product-card {
    border-radius: 25px;
    /* Make cards taller for vertical displays */
    min-height: 400px;
  }
  
  .image-container {
    height: 85%;
    border-radius: 20px;
  }
  
  .product-info {
    height: 15%;
    padding: 20px;
  }
  
  .product-title {
    font-size: 1.8rem;
    font-weight: 800;
  }
  
  .qr-overlay {
    bottom: 15px;
    right: 15px;
    padding: 8px;
    border-radius: 10px;
  }
  
  .price-badge {
    font-size: 1.4rem;
    padding: 12px 24px;
    top: 20px;
    right: 20px;
  }
}

/* Smaller vertical displays */
@media (orientation: portrait) and (max-width: 1080px) {
  .product-card {
    min-height: 350px;
  }
  
  .product-info {
    padding: 15px;
  }
  
  .product-title {
    font-size: 1.3rem;
  }
  
  .qr-overlay {
    bottom: 12px;
    right: 12px;
    padding: 5px;
  }
}
</style> 