<template>
  <div class="error-state">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h3>Unable to Load Products</h3>
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-button">
        Try Again
      </button>
    </div>
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
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: var(--bg-light);
  color: var(--text-primary);
}

.error-content {
  text-align: center;
  padding: 2rem;
  max-width: 400px;
  
  h3 {
    margin: 1rem 0 0.5rem 0;
    color: var(--error-color);
    font-weight: 700;
    font-family: var(--font-family);
  }
  
  p {
    color: var(--text-secondary);
    margin: 0 0 1.5rem 0;
    opacity: 0.8;
    line-height: 1.6;
    font-family: var(--font-family);
  }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-button {
  background: var(--primary-color);
  color: var(--text-primary);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    background: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &:active {
    transform: translateY(0);
  }
}
</style> 