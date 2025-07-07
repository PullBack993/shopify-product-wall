🧩 Offline Shopify Product Wall – Development Plan (Vue 3 + Caching)

✅ Goal Recap

Create a fullscreen Pinterest-style product wall (with animations and QR codes), powered by a Raspberry Pi in vertical mode, that:

Loads product data from Shopify via a cron job
Caches data as JSON on your NAS
Uses Vue 3 on the frontend to fetch, cache, and display products
Works offline using browser cache or fallback file
Requires no rebuilds when product data changes
⚙️ 1. SYSTEM ARCHITECTURE

+--------------------+
|  Shopify Admin API |
+--------------------+
         ↓ (cron job)
+----------------------------+
| Node.js Sync Script (NAS) |
| - Fetches Shopify Products|
| - Outputs products.json    |
+----------------------------+
         ↓ (served by NAS)
+----------------------------+
| Vue 3 App (Raspberry Pi)   |
| - Loads products.json      |
| - Caches to localStorage   |
| - Fallback: local copy     |
| - Animates product display |
+----------------------------+
🛠️ 2. TECH STACK

Frontend
Tool	Purpose
Vue 3 + Vite	Fast, lightweight SPA
vue-masonry-wall	Pinterest-style grid
vue-qrcode-component	Generate QR codes per product
TransitionGroup or GSAP	Animate product transitions
localStorage + fallback.json	Offline caching
Backend (NAS)
Tool	Purpose
Node.js + @shopify/shopify-api	Fetch Shopify data
JSON file (products.json)	Local data store
Express or NGINX	Serve JSON from NAS
Docker + cron	Schedule sync script
📁 3. PROJECT STRUCTURE

Backend (nas-backend/)
nas-backend/
├── cron/
│   └── sync-products.js       # Shopify → products.json
├── data/
│   └── products.json          # Output from sync
├── Dockerfile
└── docker-compose.yml         # Mongo (optional), cron job, server
Frontend (product-wall/)
product-wall/
├── public/
│   └── fallback.json          # Default product data
├── src/
│   ├── composables/
│   │   └── useProducts.js     # Fetch & cache logic
│   ├── components/
│   │   ├── ProductGrid.vue
│   │   └── ProductCard.vue
│   ├── App.vue
│   └── main.js
├── vite.config.js
└── index.html
🔄 4. BACKEND WORKFLOW (Sync Products)

sync-products.js (simplified flow):
Connect to Shopify Admin API (handle pagination)
Extract fields: title, handle, first image, product URL
Output single products.json file
Save to shared NAS folder
// Example product structure
{
  id: 123456,
  title: "Blue Hat",
  productUrl: "https://yourstore.myshopify.com/products/blue-hat",
  imageUrl: "https://cdn.shopify.com/...",
  price: "29.99",
  updatedAt: "2025-07-07T00:00:00Z"
}
Scheduled with node-cron (e.g. every Sunday):
cron.schedule('0 2 * * 0', () => {
  runSyncScript()
})
🌐 5. FRONTEND DATA FLOW (Vue 3)

useProducts.js logic:
Try to fetch latest products.json from NAS
On failure, fallback to:
localStorage cache
fallback.json in public/
Return products to the grid
export async function useProducts() {
  const localKey = 'cached-products'
  let products = []

  try {
    const res = await fetch('http://nas-ip/data/products.json', { cache: 'no-store' })
    if (!res.ok) throw new Error()
    products = await res.json()
    localStorage.setItem(localKey, JSON.stringify(products))
  } catch {
    const cached = localStorage.getItem(localKey)
    if (cached) {
      products = JSON.parse(cached)
    } else {
      const fallback = await fetch('/fallback.json')
      products = await fallback.json()
    }
  }

  return products
}
🧱 6. UI COMPONENTS

ProductCard.vue
Image display
Title overlay
 code
ProductGrid.vue
Uses <TransitionGroup> for fade-in/out
Displays max X products at once
Cycles new products in every Y seconds
<TransitionGroup name="fade" tag="div" class="grid">
  <div v-for="product in displayedProducts" :key="product.id">
    <ProductCard :product="product" />
  </div>
</TransitionGroup>

in .env are admin_api_token and shopify_store url