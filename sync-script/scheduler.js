#!/usr/bin/env node

import cron from 'node-cron'
import { syncProducts } from './sync-products.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Configuration
const config = {
  // Default: Every 2 weeks on Sunday at 2 AM (0 2 */14 * 0)
  // Alternative: Every 2 weeks on Sunday at 2 AM (0 2 * * 0/2) - this might not work as expected
  // Better: Every 2 weeks on Sunday at 2 AM
  cronSchedule: process.env.SYNC_SCHEDULE || "0 2 */14 * 0",
  runOnStart: process.env.RUN_ON_START === "true" || false,
  timezone: process.env.TIMEZONE || "Europe/Vienna", // Changed to Austrian timezone
  enableScheduler: process.env.ENABLE_SCHEDULER !== "false", // Allow disabling scheduler
};

console.log("🕐 Shopify Product Sync Scheduler v2.0");
console.log("=".repeat(50));
console.log(`Schedule: ${config.cronSchedule} (Every 2 weeks)`);
console.log(`Timezone: ${config.timezone}`)
console.log(`Run on start: ${config.runOnStart}`)
console.log(`Scheduler enabled: ${config.enableScheduler}`);
console.log("=".repeat(50));

// Validate cron schedule
if (!cron.validate(config.cronSchedule)) {
  console.error('❌ Invalid cron schedule:', config.cronSchedule)
  console.error("💡 Example valid schedules:");
  console.error('   - "0 2 */14 * 0" - Every 2 weeks on Sunday at 2 AM');
  console.error('   - "0 2 1,15 * *" - 1st and 15th of every month at 2 AM');
  console.error('   - "0 2 * * 0" - Every Sunday at 2 AM');
  process.exit(1)
}

// Wrapper function for scheduled sync
async function scheduledSync() {
  const timestamp = new Date().toISOString()
  console.log(`\n🔄 [${timestamp}] Running scheduled sync...`)
  
  try {
    await syncProducts();
    console.log(`✅ [${timestamp}] Scheduled sync completed successfully`);

    // Log next run time
    if (config.enableScheduler && task) {
      const nextRun = task.nextDates(1)[0];
      console.log(`🎯 Next scheduled sync: ${nextRun.toISOString()}`);
    }
  } catch (error) {
    console.error(`❌ [${timestamp}] Scheduled sync failed:`, error.message);

    // Log error details for debugging
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run sync on startup if configured
if (config.runOnStart) {
  console.log('🚀 Running initial sync...')
  scheduledSync()
}

let task = null;

// Schedule the sync job only if enabled
if (config.enableScheduler) {
  task = cron.schedule(config.cronSchedule, scheduledSync, {
    scheduled: true,
    timezone: config.timezone,
  });

  console.log(`✅ Sync scheduled successfully`);
  console.log(`🎯 Next run: ${task.nextDates(1)[0].toISOString()}`);
  console.log(`📅 Schedule breakdown:`);
  console.log(`   - Runs every 2 weeks`);
  console.log(`   - On Sundays at 2:00 AM`);
  console.log(`   - Timezone: ${config.timezone}`);
} else {
  console.log(`⏸️  Scheduler disabled (set ENABLE_SCHEDULER=true to enable)`);
}

console.log('⏹️  Press Ctrl+C to stop the scheduler')

// Manual sync endpoint (for testing)
process.on('SIGUSR1', async () => {
  console.log('\n🔄 Manual sync triggered (SIGUSR1)')
  await scheduledSync()
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping scheduler...')
  if (task) {
    task.stop();
    console.log("✅ Scheduler stopped");
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping scheduler...')
  if (task) {
    task.stop();
    console.log("✅ Scheduler stopped");
  }
  process.exit(0)
})

// Keep the process alive
if (config.enableScheduler || config.runOnStart) {
  process.stdin.resume();
} else {
  console.log(
    "👋 No scheduler enabled and no initial sync requested. Exiting."
  );
  process.exit(0);
} 