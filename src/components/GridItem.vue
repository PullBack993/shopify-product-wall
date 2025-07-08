<template>
  <div 
    class="grid-item" 
    :class="{ 'image-changing': isChanging }"
    :style="{ 
      aspectRatio: image.aspectRatio,
      animationDelay: `${Math.random() * 0.5}s`
    }"
  >
    <div class="image-container">
      <img
        :src="image.url"
        :alt="image.alt"
        class="grid-image"
        loading="lazy"
        @load="onImageLoad"
        @error="onImageError"
      />
      
      <!-- Initial loading skeleton -->
      <div v-if="isLoading" class="loading-skeleton"></div>
      
      <!-- Error state -->
      <div v-if="hasError" class="error-state">
        <span>⚠️ Image unavailable</span>
      </div>
      
      <!-- Overlay content -->
      <div class="overlay">
        <div class="text-overlay">
          <h3 class="product-title">{{ image.text }}</h3>
          <p v-if="image.price" class="product-price">€{{ image.price }}</p>
          <p v-if="image.productType" class="product-type">{{ image.productType }}</p>
        </div>
        
        <!-- QR Code -->
        <div class="qr-container">
          <canvas 
            ref="qrCanvas" 
            class="qr-code"
            :title="`QR Code for ${image.text}`"
          ></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import QRCode from 'qrcode'
import type { GridImage } from '@/types'

interface Props {
  image: GridImage
}

const props = defineProps<Props>()

const qrCanvas = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const isChanging = ref(false)

const onImageLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const onImageError = () => {
  isLoading.value = false
  hasError.value = true
}

const generateQRCode = async () => {
  await nextTick()
  
  if (!qrCanvas.value) return
  
  try {
    await QRCode.toCanvas(qrCanvas.value, props.image.qrCodeData, {
      width: 100, // Optimized for column width (300px)
      margin: 0,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('QR Code generation failed:', error)
  }
}

// Watch for image prop changes to detect rotation
watch(() => props.image, (newImage, oldImage) => {
  console.log(`🔍 GRIDITEM WATCH TRIGGERED:`)
  console.log(`   • Component has image: ${props.image.text}`)
  console.log(`   • New image ID: ${newImage.id}`)
  console.log(`   • Old image ID: ${oldImage?.id || 'undefined'}`)
  
  if (oldImage && newImage.id !== oldImage.id) {
    console.log(`🎨 GRIDITEM: Image change detected!`)
    console.log(`   Component received new image:`)
    console.log(`   • Old ID: ${oldImage.id}`)
    console.log(`   • New ID: ${newImage.id}`)
    console.log(`   • Old Product: "${oldImage.text}"`)
    console.log(`   • New Product: "${newImage.text}"`)
    console.log(`   • Old URL: ${oldImage.url}`)
    console.log(`   • New URL: ${newImage.url}`)
    
    // Smooth fade transition
    isChanging.value = true
    isLoading.value = false 
    hasError.value = false
    
    // Fade out, then fade in with new image
    setTimeout(() => {
      console.log(`✅ GRIDITEM: Animation complete for "${newImage.text}"`)
      isChanging.value = false
    }, 600) // Smooth fade duration
    
    // Update QR code immediately
    nextTick(() => {
      generateQRCode()
    })
  } else {
    console.log(`🔍 GRIDITEM: No ID change detected (${oldImage?.id || 'no old'} → ${newImage.id})`)
  }
}, { deep: true, flush: 'post' })

// Also watch the key prop to ensure Vue is tracking changes
watch(() => props.image.id, (newId, oldId) => {
  console.log(`🔑 GRIDITEM ID WATCH: ${oldId} → ${newId}`)
}, { flush: 'post' })

onMounted(() => {
  generateQRCode()
})
</script>

<style lang="scss" scoped>
.grid-item {
  position: relative;
  break-inside: avoid;
  margin-bottom: 4px; /* Minimal gap for maximum screen usage */
  border-radius: 14px;
  overflow: hidden;
  background: #f8f9fa;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
  display: inline-block;
  width: 100%;
  vertical-align: top;
  min-height: 250px; /* Ensure minimum height for visibility */
  box-sizing: border-box;
  
  &:hover {
    transform: translateY(-2px); /* Reduced to minimize visual gaps */
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    
    .grid-image {
      transform: scale(1.01); /* Subtle scaling */
    }
  }
  
  // Smooth fade animation when image changes
  &.image-changing {
    .grid-image {
      animation: smoothFade 0.6s ease-in-out;
    }
    
    .overlay {
      animation: overlayFade 0.6s ease-in-out;
    }
  }
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
  display: block;
  
  &.image-hidden {
    opacity: 0;
    pointer-events: none;
    transform: scale(0.95);
    filter: blur(2px);
  }
}

.loading-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 37%,
    #f0f0f0 63%
  );
  background-size: 400% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
}

.rotation-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 15; /* Above everything */
  background: rgba(255, 215, 0, 0.9); /* Bright gold background for visibility */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  animation: rotationFlash 1s ease-in-out infinite;
  border: 3px solid #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  
  .skeleton-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.1) 25%,
      rgba(255, 255, 255, 0.2) 37%,
      rgba(255, 255, 255, 0.1) 63%
    );
    background-size: 400% 100%;
    animation: skeleton 1.8s ease-in-out infinite;
  }
  
  .skeleton-overlay {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }
  
  .skeleton-text {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .skeleton-title,
  .skeleton-price,
  .skeleton-type {
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.8) 25%,
      rgba(0, 0, 0, 0.9) 37%,
      rgba(0, 0, 0, 0.8) 63%
    );
    background-size: 400% 100%;
    animation: skeleton 1.5s ease-in-out infinite;
    border-radius: 4px;
    border: 1px solid #000;
  }
  
  .skeleton-title {
    height: 24px;
    width: 85%;
  }
  
  .skeleton-price {
    height: 22px;
    width: 40%;
  }
  
  .skeleton-type {
    height: 14px;
    width: 60%;
  }
  
  .skeleton-qr {
    width: 100px;
    height: 100px;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.9) 25%,
      rgba(0, 0, 0, 1) 37%,
      rgba(0, 0, 0, 0.9) 63%
    );
    background-size: 400% 100%;
    animation: skeleton 1.5s ease-in-out infinite;
    border-radius: 10px;
    border: 2px solid #000;
    align-self: flex-end;
  }
}

.error-state {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #6c757d;
  font-size: 14px;
  text-align: center;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.3) 30%,
    rgba(0, 0, 0, 0.1) 70%,
    rgba(0, 0, 0, 0.9) 100%
  );
  opacity: 1; /* Always visible for TV display */
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}

.text-overlay {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.product-title {
  font-size: 20px; /* Optimized for portrait TV */
  font-weight: 700;
  margin: 0 0 10px 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 22px; /* Optimized for portrait TV */
  font-weight: 800;
  margin: 0 0 6px 0;
  color: #ffd700;
}

.product-type {
  font-size: 14px; /* Optimized for portrait TV */
  opacity: 0.9;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
}

.qr-container {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.qr-code {
  border-radius: 10px;
  background: white;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes skeleton {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

@keyframes smoothFade {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes overlayFade {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes imageChange {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  25% {
    transform: scale(1.05);
    box-shadow: 0 8px 40px rgba(255, 215, 0, 0.6);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 12px 50px rgba(255, 215, 0, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
}

@keyframes imageFlash {
  0% {
    opacity: 0.3;
    filter: brightness(1.5) saturate(1.2);
  }
  25% {
    opacity: 0.8;
    filter: brightness(1.3) saturate(1.1);
  }
  50% {
    opacity: 1;
    filter: brightness(1.1) saturate(1.05);
  }
  100% {
    opacity: 1;
    filter: brightness(1) saturate(1);
  }
}

@keyframes rotationFlash {
  0% {
    opacity: 0.8;
    background: rgba(255, 215, 0, 0.9);
    transform: scale(1);
  }
  25% {
    opacity: 1;
    background: rgba(255, 165, 0, 0.95);
    transform: scale(1.02);
  }
  50% {
    opacity: 0.9;
    background: rgba(255, 215, 0, 0.8);
    transform: scale(0.98);
  }
  75% {
    opacity: 1;
    background: rgba(255, 140, 0, 0.95);
    transform: scale(1.01);
  }
  100% {
    opacity: 0.8;
    background: rgba(255, 215, 0, 0.9);
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .grid-item {
    margin-bottom: 16px;
    border-radius: 12px;
  }
  
  .overlay {
    padding: 16px;
  }
  
  .product-title {
    font-size: 18px;
  }
  
  .product-price {
    font-size: 20px;
  }
  
  .product-type {
    font-size: 14px;
  }
  
}
</style> 