#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the service worker file
const swPath = path.join(__dirname, '../public/sw.js');

// Function to increment version number
function incrementVersion(version) {
  const match = version.match(/v(\d+)/);
  if (match) {
    const num = parseInt(match[1]) + 1;
    return `v${num}`;
  }
  return 'v1';
}

// Function to update cache version in service worker
function updateCacheVersion() {
  try {
    // Read the service worker file
    let content = fs.readFileSync(swPath, 'utf8');
    
    // Find current version
    const versionMatch = content.match(/const CACHE_VERSION = "([^"]+)"/);
    
    if (versionMatch) {
      const currentVersion = versionMatch[1];
      const newVersion = incrementVersion(currentVersion);
      
      // Replace the version
      content = content.replace(
        /const CACHE_VERSION = "[^"]+"/,
        `const CACHE_VERSION = "${newVersion}"`
      );
      
      // Write back to file
      fs.writeFileSync(swPath, content, 'utf8');
      
      console.log(`✅ Cache version updated from ${currentVersion} to ${newVersion}`);
      return newVersion;
    } else {
      console.error('❌ Could not find CACHE_VERSION in service worker');
      return null;
    }
  } catch (error) {
    console.error('❌ Error updating cache version:', error);
    return null;
  }
}

// Main execution
if (process.argv.includes('--update-version')) {
  const newVersion = updateCacheVersion();
  if (newVersion) {
    console.log(`🚀 Ready for deployment with cache version: ${newVersion}`);
  } else {
    process.exit(1);
  }
} else {
  console.log('Usage: node scripts/deploy.js --update-version');
  console.log('This script increments the cache version in the service worker for deployment.');
} 