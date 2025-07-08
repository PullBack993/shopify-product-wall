<template>
  <footer class="footer">
    <div class="display-info">
      📱 Portrait TV | {{ displayCount }}/{{ totalCount }} Fabrics | {{ numColumns }} Cols | 🎯 C{{ currentCycle }}: {{ progressPercentage }}% | 🔄 Shown: {{ totalProductsShown }}
    </div>
    <div class="last-updated">
      Last updated: {{ lastUpdated }}
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  displayCount: number
  totalCount: number
  numColumns: number
  currentCycle: number
  rotationIndex: number
  rotationQueueLength: number
  totalProductsShown: number
  lastUpdated: string
}

const props = defineProps<Props>()

const progressPercentage = computed(() => {
  return Math.round((props.rotationIndex / Math.max(props.rotationQueueLength, 1)) * 100)
})
</script>

<style lang="scss" scoped>
.footer {
  background: rgba(0, 0, 0, 0.2);
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .display-info {
    font-weight: 600;
    opacity: 0.9;
  }
  
  .last-updated {
    opacity: 0.8;
    font-size: 0.9rem;
    
    .dev-hint {
      color: #ffd700;
      font-weight: 600;
      opacity: 0.9;
      animation: pulse 2s ease-in-out infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.5; }
}

@media (max-width: 1200px) {
  .footer {
    padding: 16px 25px;
  }
}

@media (max-width: 768px) {
  .footer {
    padding: 16px 20px;
    flex-direction: row; /* Keep horizontal for TV */
    gap: 8px;
    justify-content: space-between;
  }
}
</style> 