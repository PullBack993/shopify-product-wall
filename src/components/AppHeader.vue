<template>
  <header class="header">

  </header>
</template>

<script setup lang="ts">
interface Props {
  storeTitle: string
  isOnline: boolean
  loading: boolean
  shuffling: boolean
}

defineProps<Props>()

defineEmits<{
  shuffle: []
}>()
</script>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(102, 126, 234, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 40px;
  
}
</style> 