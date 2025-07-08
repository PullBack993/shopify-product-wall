import { onMounted, onUnmounted } from 'vue'

export function useAutoRefresh(refreshCallback: () => void) {
  let refreshInterval: number

  const startAutoRefresh = (intervalMinutes: number = 30) => {
    // Auto-refresh every N minutes
    refreshInterval = setInterval(() => {
      refreshCallback()
    }, intervalMinutes * 60 * 1000)
    
    console.log(`Auto-refresh started: every ${intervalMinutes} minutes`)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      console.log('Auto-refresh stopped')
    }
  }

  // Auto-start and cleanup
  onMounted(() => {
    startAutoRefresh()
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    startAutoRefresh,
    stopAutoRefresh
  }
} 