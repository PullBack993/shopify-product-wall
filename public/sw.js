// const CACHE_NAME = 'shopify-product-wall-v1'
// const STATIC_CACHE_NAME = 'static-v1'
// const DYNAMIC_CACHE_NAME = 'dynamic-v1'

// // Static assets to cache
// const STATIC_ASSETS = [
//   '/',
//   '/index.html',
//   '/src/main.js',
//   '/src/App.vue',
//   '/src/style.css',
//   '/fallback.json'
// ]

// // Dynamic assets patterns
// const DYNAMIC_PATTERNS = [
//   /^\/data\/products\.json$/,
//   /^\/products\/.*\.jpg$/
// ]

// // Install event - cache static assets
// self.addEventListener('install', (event) => {
//   console.log('🔧 Service Worker installing...')
  
//   event.waitUntil(
//     caches.open(STATIC_CACHE_NAME)
//       .then((cache) => {
//         console.log('📦 Caching static assets')
//         return cache.addAll(STATIC_ASSETS)
//       })
//       .then(() => {
//         console.log('✅ Static assets cached successfully')
//         return self.skipWaiting()
//       })
//       .catch((error) => {
//         console.error('❌ Error caching static assets:', error)
//       })
//   )
// })

// // Activate event - clean up old caches
// self.addEventListener('activate', (event) => {
//   console.log('⚡ Service Worker activating...')
  
//   event.waitUntil(
//     caches.keys()
//       .then((cacheNames) => {
//         return Promise.all(
//           cacheNames.map((cacheName) => {
//             if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
//               console.log('🗑️ Deleting old cache:', cacheName)
//               return caches.delete(cacheName)
//             }
//           })
//         )
//       })
//       .then(() => {
//         console.log('✅ Service Worker activated')
//         return self.clients.claim()
//       })
//   )
// })

// // Fetch event - serve from cache or network
// self.addEventListener('fetch', (event) => {
//   const { request } = event
//   const url = new URL(request.url)
  
//   // Skip non-GET requests
//   if (request.method !== 'GET') {
//     return
//   }
  
//   // Skip chrome-extension requests
//   if (url.protocol === 'chrome-extension:') {
//     return
//   }
  
//   // Handle different types of requests
//   if (isStaticAsset(url.pathname)) {
//     event.respondWith(cacheFirst(request, STATIC_CACHE_NAME))
//   } else if (isDynamicAsset(url.pathname)) {
//     event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME))
//   } else {
//     event.respondWith(cacheFirst(request, STATIC_CACHE_NAME))
//   }
// })

// // Check if URL is a static asset
// function isStaticAsset(pathname) {
//   return STATIC_ASSETS.some(asset => pathname === asset || pathname.startsWith(asset))
// }

// // Check if URL is a dynamic asset
// function isDynamicAsset(pathname) {
//   return DYNAMIC_PATTERNS.some(pattern => pattern.test(pathname))
// }

// // Cache first strategy - for static assets
// async function cacheFirst(request, cacheName) {
//   try {
//     const cache = await caches.open(cacheName)
//     const cachedResponse = await cache.match(request)
    
//     if (cachedResponse) {
//       console.log('📦 Serving from cache:', request.url)
//       return cachedResponse
//     }
    
//     console.log('🌐 Fetching from network:', request.url)
//     const networkResponse = await fetch(request)
    
//     if (networkResponse.ok) {
//       const responseClone = networkResponse.clone()
//       cache.put(request, responseClone)
//       console.log('💾 Cached:', request.url)
//     }
    
//     return networkResponse
//   } catch (error) {
//     console.error('❌ Cache first error:', error)
    
//     // Return fallback for critical assets
//     if (request.url.includes('products.json')) {
//       return caches.match('/fallback.json')
//     }
    
//     throw error
//   }
// }

// // Network first strategy - for dynamic content
// async function networkFirst(request, cacheName) {
//   try {
//     console.log('🌐 Network first - fetching:', request.url)
//     const networkResponse = await fetch(request)
    
//     if (networkResponse.ok) {
//       const cache = await caches.open(cacheName)
//       const responseClone = networkResponse.clone()
//       cache.put(request, responseClone)
//       console.log('💾 Cached:', request.url)
//     }
    
//     return networkResponse
//   } catch (error) {
//     console.warn('🌐 Network failed, trying cache:', request.url)
    
//     const cache = await caches.open(cacheName)
//     const cachedResponse = await cache.match(request)
    
//     if (cachedResponse) {
//       console.log('📦 Serving from cache:', request.url)
//       return cachedResponse
//     }
    
//     // Return fallback for products.json
//     if (request.url.includes('products.json')) {
//       console.log('🔄 Using fallback data')
//       return caches.match('/fallback.json')
//     }
    
//     throw error
//   }
// }

// // Background sync for product updates
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'background-sync-products') {
//     console.log('🔄 Background sync: products')
//     event.waitUntil(syncProducts())
//   }
// })

// // Background sync function
// async function syncProducts() {
//   try {
//     console.log('🔄 Syncing products in background...')
    
//     const response = await fetch('/data/products.json', {
//       cache: 'no-cache'
//     })
    
//     if (response.ok) {
//       const cache = await caches.open(DYNAMIC_CACHE_NAME)
//       await cache.put('/data/products.json', response.clone())
//       console.log('✅ Products synced successfully')
      
//       // Notify clients about the update
//       const clients = await self.clients.matchAll()
//       clients.forEach(client => {
//         client.postMessage({
//           type: 'PRODUCTS_UPDATED',
//           timestamp: new Date().toISOString()
//         })
//       })
//     }
//   } catch (error) {
//     console.error('❌ Background sync failed:', error)
//   }
// }

// // Push notifications (for future use)
// self.addEventListener('push', (event) => {
//   if (event.data) {
//     const data = event.data.json()
    
//     const options = {
//       body: data.body || 'New products available!',
//       icon: '/icon-192x192.png',
//       badge: '/badge-72x72.png',
//       data: data.data || {},
//       actions: [
//         {
//           action: 'view',
//           title: 'View Products'
//         },
//         {
//           action: 'close',
//           title: 'Close'
//         }
//       ]
//     }
    
//     event.waitUntil(
//       self.registration.showNotification(data.title || 'Product Wall', options)
//     )
//   }
// })

// // Notification click handler
// self.addEventListener('notificationclick', (event) => {
//   event.notification.close()
  
//   if (event.action === 'view') {
//     event.waitUntil(
//       clients.openWindow('/')
//     )
//   }
// })

// // Message handler for communication with main thread
// self.addEventListener('message', (event) => {
//   const { type, data } = event.data
  
//   switch (type) {
//     case 'SKIP_WAITING':
//       self.skipWaiting()
//       break
      
//     case 'CACHE_PRODUCTS':
//       event.waitUntil(
//         caches.open(DYNAMIC_CACHE_NAME)
//           .then(cache => cache.put('/data/products.json', new Response(JSON.stringify(data.products))))
//       )
//       break
      
//     case 'CLEAR_CACHE':
//       event.waitUntil(
//         caches.keys()
//           .then(cacheNames => Promise.all(
//             cacheNames.map(cacheName => caches.delete(cacheName))
//           ))
//       )
//       break
      
//     default:
//       console.log('📨 Unknown message type:', type)
//   }
// }) 