#!/usr/bin/env node

import cron from 'node-cron'
import { syncProducts } from './sync-products.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Configuration
const config = {
  // Default: Every Sunday at 2 AM
  cronSchedule: process.env.SYNC_SCHEDULE || '0 2 * * 0',
  runOnStart: process.env.RUN_ON_START === 'true' || false,
  timezone: process.env.TIMEZONE || 'America/New_York'
}

console.log('🕐 Shopify Product Sync Scheduler')
console.log('=' .repeat(40))
console.log(`Schedule: ${config.cronSchedule}`)
console.log(`Timezone: ${config.timezone}`)
console.log(`Run on start: ${config.runOnStart}`)
console.log('=' .repeat(40))

// Validate cron schedule
if (!cron.validate(config.cronSchedule)) {
  console.error('❌ Invalid cron schedule:', config.cronSchedule)
  process.exit(1)
}

// Wrapper function for scheduled sync
async function scheduledSync() {
  const timestamp = new Date().toISOString()
  console.log(`\n🔄 [${timestamp}] Running scheduled sync...`)
  
  try {
    await syncProducts()
    console.log(`✅ [${timestamp}] Scheduled sync completed successfully`)
  } catch (error) {
    console.error(`❌ [${timestamp}] Scheduled sync failed:`, error.message)
  }
}

// Run sync on startup if configured
if (config.runOnStart) {
  console.log('🚀 Running initial sync...')
  scheduledSync()
}

// Schedule the sync job
const task = cron.schedule(config.cronSchedule, scheduledSync, {
  scheduled: true,
  timezone: config.timezone
})

console.log(`✅ Sync scheduled successfully`)
console.log('🎯 Next run:', task.nextDates(1)[0].toISOString())
console.log('⏹️  Press Ctrl+C to stop the scheduler')

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping scheduler...')
  task.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping scheduler...')
  task.stop()
  process.exit(0)
})

// Keep the process alive
process.stdin.resume() 