<template>
  <div class="error-state">
    <div class="error-icon">⚠️</div>
    <h2>Oops! Something went wrong</h2>
    <p>{{ error }}</p>
    <button @click="$emit('retry')" class="retry-btn">
      Try Again
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error: string
}

defineProps<Props>()

defineEmits<{
  retry: []
}>()
</script>

<style lang="scss" scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style> 