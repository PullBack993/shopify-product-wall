// Service Worker Configuration
const CACHE_VERSION = "v3"; // Increment this for each deployment
const CACHE_NAME = `shopify-product-wall-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;

// Static assets to cache
const STATIC_ASSETS = ["/", "/index.html", "/data/products.json"];

// Check if we're in development mode
const isDevelopment =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname.includes("dev") ||
  self.location.hostname.includes("local");

// If in development mode, don't install the service worker
if (isDevelopment) {
  console.log("🚫 Service Worker disabled in development mode");
  self.addEventListener("install", (event) => {
    // Skip installation in development
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener("activate", (event) => {
    // Clear any existing caches in development
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        )
    );
  });

  self.addEventListener("fetch", (event) => {
    // Let all requests go through normally in development
    return;
  });

  self.addEventListener("message", (event) => {
    // Ignore messages in development
    console.log(
      "📨 Service Worker disabled - ignoring message:",
      event.data.type
    );
  });

  return;
}

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...", CACHE_VERSION);

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("✅ Static assets cached successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Error caching static assets:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("⚡ Service Worker activating...", CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete all old cache versions (anything not matching current version)
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker activated and old caches cleaned");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network (no image preloading)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // Skip Shopify CDN images to avoid CORS issues
  if (url.hostname.includes("cdn.shopify.com")) {
    // Let browser handle Shopify images normally
    return;
  }

  // Handle products.json with network-first strategy
  if (url.pathname.includes("products.json")) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME));
  }
  // Handle static assets with cache-first strategy
  else if (
    STATIC_ASSETS.some(
      (asset) => url.pathname === asset || url.pathname.startsWith(asset)
    )
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  }
  // Let other requests go through normally
});

// Cache first strategy - for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("📦 Serving from cache:", request.url);
      return cachedResponse;
    }

    console.log("🌐 Fetching from network:", request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log("💾 Cached:", request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error("❌ Cache first error:", error);

    // Return fallback for critical assets
    if (request.url.includes("products.json")) {
      return caches.match("/fallback.json");
    }

    throw error;
  }
}

// Network first strategy - for dynamic content
async function networkFirst(request, cacheName) {
  try {
    console.log("🌐 Network first - fetching:", request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log("💾 Cached:", request.url);
    }

    return networkResponse;
  } catch (error) {
    console.warn("🌐 Network failed, trying cache:", request.url);

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("📦 Serving from cache:", request.url);
      return cachedResponse;
    }

    // Return fallback for products.json
    if (request.url.includes("products.json")) {
      console.log("🔄 Using fallback data");
      return caches.match("/fallback.json");
    }

    throw error;
  }
}

// Message handler for communication with main thread
self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "DISABLE_IMAGE_PRELOADING":
      console.log("🚫 Image preloading disabled (CORS-safe mode)");
      break;

    case "CACHE_PRODUCTS":
      event.waitUntil(
        caches
          .open(DYNAMIC_CACHE_NAME)
          .then((cache) =>
            cache.put(
              "/data/products.json",
              new Response(JSON.stringify(data.products))
            )
          )
      );
      break;

    case "CLEAR_CACHE":
      event.waitUntil(
        caches
          .keys()
          .then((cacheNames) =>
            Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
          )
      );
      break;

    case "GET_VERSION":
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;

    default:
      console.log("📨 Unknown message type:", type);
  }
});
