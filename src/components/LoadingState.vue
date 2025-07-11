<template>
  <div class="loading-state">
    <div class="loading-content">
      <div class="spinner"></div>
      <h3>Loading Products...</h3>
      <p>Fetching the latest fabric collection</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props needed for this component
</script>

<style lang="scss" scoped>
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: var(--bg-light);
  color: var(--text-primary);
}

.loading-content {
  text-align: center;
  padding: 2rem;
  
  h3 {
    margin: 1rem 0 0.5rem 0;
    color: var(--text-primary);
    font-weight: 700;
    font-family: var(--font-family);
  }
  
  p {
    color: var(--text-secondary);
    margin: 0;
    opacity: 0.8;
    font-family: var(--font-family);
  }
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--secondary-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 