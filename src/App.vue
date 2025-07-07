<template>
  <div class="app">
    <div class="header">
      <h1 class="store-title">{{ storeTitle }}</h1>
      <div class="status-indicator" :class="{ 'online': isOnline, 'offline': !isOnline }">
        {{ isOnline ? 'LIVE' : 'OFFLINE' }}
      </div>
    </div>
    
    <ProductGrid 
      :products="products" 
      :loading="loading"
      :error="error"
      @refresh="refreshProducts"
    />
    
    <div class="footer">
      <div class="display-info">
        📺 Vertical TV Display | 3x5 Grid | 1.5s Rotation
      </div>
      <div class="last-updated">
        Last updated: {{ lastUpdated }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useOnline } from '@vueuse/core'
import ProductGrid from './components/ProductGrid.vue'
import { useProducts } from './composables/useProducts'

const storeTitle = ref('STOFFEYA')
const isOnline = useOnline()

const { 
  products, 
  loading, 
  error, 
  lastUpdated,
  refreshProducts 
} = useProducts()

let refreshInterval

onMounted(() => {
  // Auto-refresh every 30 minutes
  refreshInterval = setInterval(() => {
    refreshProducts()
  }, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style lang="scss" scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  
  .store-title {
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    letter-spacing: 2px;
  }
  
  .status-indicator {
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    
    &.online {
      background: #4ade80;
      color: #065f46;
    }
    
    &.offline {
      background: #f87171;
      color: #7f1d1d;
    }
  }
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  
  .display-info {
    font-size: 1rem;
    font-weight: 600;
    opacity: 0.9;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    color: #4ade80;
  }
  
  .last-updated {
    font-size: 0.9rem;
    opacity: 0.8;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  }
}
</style> 