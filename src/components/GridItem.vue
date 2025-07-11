<template>
  <div 
    class="grid-item" 
    :class="{ 
      'image-changing': isChanging,
      [colorScheme || 'scheme-6']: true
    }"
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
      
      <!-- Product Label Badge -->
      <div v-if="image?.label" class="product-label" :class="`label-${image.label}`">
        <span v-if="image?.label === 'sale'">🏷️ SALE</span>
        <span v-else-if="image?.label === 'new'">✨ NEW</span>
        <span v-else-if="image?.label === 'top-selling'">🔥 TOP</span>
      </div>
      
      <!-- Overlay content -->
      <div class="overlay">
        <div class="text-overlay">
          <h3 class="product-title">{{ image.text }}</h3>
          <p v-if="image.productType" class="product-type">{{ image.productType }}
          <p v-if="image.price" class="product-price">€{{ image.price }}</p>
          </p>
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
  /** 
   * Color scheme from Shopify app:
   * - scheme-3: #C2B7AC (warm brownish tone)
   * - scheme-6: #EDE0D4 (light neutral tone)
   */
  colorScheme?: 'scheme-3' | 'scheme-6'
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
    // Generate the QR code first
    await QRCode.toCanvas(qrCanvas.value, props.image.qrCodeData, {
      width: 80,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    
    // Add logo to the center of the QR code
    const canvas = qrCanvas.value
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Create and load the logo image
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      
      logoImg.onload = () => {
        // Calculate logo size (about 20% of QR code size)
        const logoSize = canvas.width * 0.2
        const logoX = (canvas.width - logoSize) / 2
        const logoY = (canvas.height - logoSize) / 2
        
        // Draw a white background circle behind the logo for better visibility
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 2, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw the logo
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
      }
      
      logoImg.onerror = () => {
        console.warn('Logo could not be loaded for QR code')
      }
      
      // Load the logo from the public directory
      logoImg.src = '/favicon.svg'
    }
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
:root {
  --shopify-bg-scheme-3: #C2B7AC;
  --shopify-bg-scheme-6: #EDE0D4;
  --shopify-text-scheme-3: #332313;
  --shopify-text-scheme-6: #4F4F4F;
}

.grid-item {
  position: relative;
  break-inside: avoid;
  margin-bottom: 4px; /* Minimal gap for maximum screen usage */
  border-radius: 14px;
  overflow: hidden;
  background: var(--shopify-bg-scheme-6); /* Using the lighter scheme as default */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out both;
  display: inline-block;
  width: 100%;
  vertical-align: top;
  min-height: 250px; /* Ensure minimum height for visibility */
  box-sizing: border-box;
  
  /* Alternative scheme class */
  &.scheme-3 {
    background: var(--shopify-bg-scheme-3);
  }
  
  &.scheme-6 {
    background: var(--shopify-bg-scheme-6);
  }
  
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
    var(--shopify-bg-scheme-6) 25%,
    rgba(237, 224, 212, 0.7) 37%,
    var(--shopify-bg-scheme-6) 63%
  );
  background-size: 400% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
  
  .grid-item.scheme-3 & {
    background: linear-gradient(
      90deg,
      var(--shopify-bg-scheme-3) 25%,
      rgba(194, 183, 172, 0.7) 37%,
      var(--shopify-bg-scheme-3) 63%
    );
  }
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
  background: var(--shopify-bg-scheme-6);
  color: var(--shopify-text-scheme-6);
  font-size: 14px;
  text-align: center;
  
  .grid-item.scheme-3 & {
    background: var(--shopify-bg-scheme-3);
    color: var(--shopify-text-scheme-3);
  }
}

.product-label {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: labelPulse 2s ease-in-out infinite;
  font-family: var(--font-family);
  
  &.label-sale {
    background: linear-gradient(135deg, #ff4757, #ff3742);
    border-color: rgba(255, 255, 255, 0.3);
    
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(135deg, #ff4757, #ff3742, #ff6b7a);
      border-radius: 14px;
      z-index: -1;
      animation: saleGlow 1.5s ease-in-out infinite alternate;
    }
  }
  
  &.label-new {
    background: linear-gradient(135deg, #5352ed, #3742fa);
    border-color: rgba(255, 255, 255, 0.3);
    
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(135deg, #5352ed, #3742fa, #7bed9f);
      border-radius: 14px;
      z-index: -1;
      animation: newGlow 2s ease-in-out infinite alternate;
    }
  }
  
  &.label-top-selling {
    background: linear-gradient(135deg, #ff9f43, #ff6348);
    border-color: rgba(255, 255, 255, 0.3);
    
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(135deg, #ff9f43, #ff6348, #ffa801);
      border-radius: 14px;
      z-index: -1;
      animation: topGlow 1.8s ease-in-out infinite alternate;
    }
  }
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  opacity: 1; /* Always visible for TV display */
  background-image: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, 
  rgba(0, 0, 0, 0.6) 40%,
   rgba(0, 0, 0, 0.3) 60%,
    rgba(0, 0, 0, 0.2) 80%, 
    rgba(0, 0, 0, 0) 100%);
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  padding: 8px;
}

.text-overlay {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-right: 8px;
}

.product-title {
  font-size: 20px; /* Optimized for portrait TV */
  font-weight: 700;
  margin: 0 0 5px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-family: var(--font-family);
}

.product-price {
  font-size: 22px; /* Optimized for portrait TV */
  font-weight: 700;
  margin: 0;
  margin-right: 1rem;
  color: #ffd700;
  font-family: var(--font-family);
}

.product-type {
  font-size: 10px; /* Optimized for portrait TV */
  opacity: 0.9;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  align-items: center;
  text-align: center;
  display: flex;
  justify-content: space-between;
  font-family: var(--font-family);
}

.qr-container {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  flex-shrink: 0;
}

.qr-code {
  border-radius: 10px;
  background: rgb(255, 255, 255);
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

/* Label animation keyframes removed - no automatic labeling */

@media (max-width: 768px) {
  .grid-item {
    margin-bottom: 16px;
    border-radius: 12px;
  }
  
  .overlay {
    padding: 6px;
  }
  
  .text-overlay {
    padding-right: 6px;
  }
  
  .product-title {
    font-size: 16px;
    -webkit-line-clamp: 1;
  }
  
  .product-price {
    font-size: 18px;
  }
  
  .product-type {
    font-size: 12px;
  }
  
  .qr-code {
    padding: 4px;
  }
}
</style> 