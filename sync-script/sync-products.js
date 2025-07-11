#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { promises as fs } from 'fs'
import { createRequire } from 'module'
import axios from 'axios'
import sharp from 'sharp'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Get script directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const config = {
  shopifyStore: process.env.SHOPIFY_STORE_URL,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  productionUrl: process.env.SHOPIFY_PRODUCTION_URL,
  outputDir: join(__dirname, "..", "public", "data"),
  imagesDir: join(__dirname, "..", "public", "products"),
  maxProducts: 50, // Remove hard limit - fetch ALL products
  imageSize: 400,
  imageQuality: 85,
  concurrency: 3,
};

// Validate configuration
function validateConfig() {
  const errors = [];

  if (!config.shopifyStore) {
    errors.push("SHOPIFY_STORE_URL is required in .env file");
  }

  if (!config.accessToken) {
    errors.push("SHOPIFY_ACCESS_TOKEN is required in .env file");
  }

  if (errors.length > 0) {
    console.error("❌ Configuration errors:");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
}

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(config.outputDir, { recursive: true });
    await fs.mkdir(config.imagesDir, { recursive: true });
    console.log("📁 Directories created/verified");
  } catch (error) {
    console.error("❌ Error creating directories:", error);
    throw error;
  }
}

// Fetch ALL products from Shopify with proper pagination
async function fetchShopifyProducts() {
  console.log("🔄 Fetching ALL products from Shopify...");

  const url = `https://${config.shopifyStore}/admin/api/2023-10/products.json`;
  const headers = {
    "X-Shopify-Access-Token": config.accessToken,
    "Content-Type": "application/json",
  };

  let allProducts = [];
  let hasNextPage = true;
  let pageInfo = null;
  let pageCount = 0;

  try {
    while (hasNextPage && allProducts.length < config.maxProducts) {
      pageCount++;
      const params = {
        limit: 50,
      };

      if (pageInfo) {
        params.page_info = pageInfo;
      }

      console.log(`📦 Fetching page ${pageCount}...`);

      const response = await axios.get(url, { headers, params });
      const products = response.data.products || [];

      if (products.length === 0) {
        console.log("📭 No more products found");
        hasNextPage = false;
        break;
      }

      allProducts = allProducts.concat(products);

      // Check for pagination
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        if (nextMatch) {
          const nextUrl = new URL(nextMatch[1]);
          pageInfo = nextUrl.searchParams.get("page_info");
          console.log(`📄 Found next page, continuing...`);
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }

      console.log(`📊 Total products fetched so far: ${allProducts.length}`);

      // Small delay to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(
      `✅ Total products fetched: ${allProducts.length} across ${pageCount} pages`
    );
    return allProducts;
  } catch (error) {
    console.error("❌ Error fetching products:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

// No automatic labeling - just return raw product data

// Transform product data with enhanced information
function transformProducts(shopifyProducts) {
  console.log("🔄 Transforming product data...");

  const products = shopifyProducts
    .map((product) => {
      const firstImage =
        product.images && product.images.length > 0 ? product.images[0] : null;
      const firstVariant =
        product.variants && product.variants.length > 0
          ? product.variants[0]
          : null;

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        productUrl: `https://${config.productionUrl}/products/${product.handle}`,
        imageUrl: firstImage ? firstImage.src : null,
        imageAlt: firstImage ? firstImage.alt : null,
        price: firstVariant ? firstVariant.price : null,
        compareAtPrice: firstVariant ? firstVariant.compare_at_price : null, // For sale pricing
        vendor: product.vendor,
        productType: product.product_type,
        tags: product.tags, // Keep tags as raw string for manual processing
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        localImageUrl: null, // Will be set after image optimization
        allImages: product.images || [], // Include all images
        description: product.body_html,
        status: product.status,
        variants: product.variants || [], // Include all variants
      };
    })
    .filter((product) => product.imageUrl); // Only include products with images

  console.log(`✅ Transformed ${products.length} products (with images)`);

  return products;
}

// Download and optimize image
async function downloadAndOptimizeImage(product) {
  if (!product.imageUrl) return product;

  try {
    const imageFileName = `${product.id}.jpg`;
    const imagePath = join(config.imagesDir, imageFileName);

    // Check if image already exists and is recent
    try {
      const stats = await fs.stat(imagePath);
      const productUpdated = new Date(product.updatedAt);
      const imageModified = new Date(stats.mtime);

      if (imageModified > productUpdated) {
        console.log(`⏭️  Skipping existing image: ${imageFileName}`);
        product.localImageUrl = `/products/${imageFileName}`;
        return product;
      }
    } catch (error) {
      // Image doesn't exist, continue with download
    }

    console.log(`🖼️  Downloading image: ${product.title}`);

    // Download image
    const response = await axios.get(product.imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const imageBuffer = Buffer.from(response.data);

    // Optimize and save image
    await sharp(imageBuffer)
      .resize(config.imageSize, config.imageSize, {
        fit: "cover",
        position: "center",
      })
      .jpeg({
        quality: config.imageQuality,
        progressive: true,
      })
      .toFile(imagePath);

    product.localImageUrl = `/products/${imageFileName}`;
    console.log(`✅ Optimized image: ${imageFileName}`);

    return product;
  } catch (error) {
    console.error(
      `❌ Error processing image for ${product.title}:`,
      error.message
    );
    return product;
  }
}

// Process images with concurrency control
async function processImages(products) {
  console.log(`🔄 Processing ${products.length} images...`);

  const chunks = [];
  for (let i = 0; i < products.length; i += config.concurrency) {
    chunks.push(products.slice(i, i + config.concurrency));
  }

  const processedProducts = [];

  for (const chunk of chunks) {
    const chunkPromises = chunk.map((product) =>
      downloadAndOptimizeImage(product)
    );
    const chunkResults = await Promise.all(chunkPromises);
    processedProducts.push(...chunkResults);
  }

  console.log(`✅ Processed ${processedProducts.length} images`);
  return processedProducts;
}

// Save products to JSON file
async function saveProductsData(products) {
  console.log("🔄 Saving products data...");

  try {
    const outputPath = join(config.outputDir, "products.json");

    // Add metadata
    const data = {
      products: products,
      metadata: {
        totalCount: products.length,
        lastUpdated: new Date().toISOString(),
        shopifyStore: config.shopifyStore,
        labelCounts: products.reduce((acc, product) => {
          const label = product.label || "none";
          acc[label] = (acc[label] || 0) + 1;
          return acc;
        }, {}),
        syncVersion: "2.0.0",
      },
    };

    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Products data saved to: ${outputPath}`);

    // Also save just the products array for simpler access
    const productsOnlyPath = join(config.outputDir, "products-simple.json");
    await fs.writeFile(productsOnlyPath, JSON.stringify(products, null, 2));
    console.log(`✅ Simple products data saved to: ${productsOnlyPath}`);
  } catch (error) {
    console.error("❌ Error saving products data:", error);
    throw error;
  }
}

// Create fallback data
async function createFallbackData(products) {
  console.log("🔄 Creating fallback data...");

  try {
    const fallbackPath = join(__dirname, "..", "public", "fallback.json");

    // Create a subset of products for fallback
    const fallbackProducts = products.slice(0, 12).map((product) => ({
      ...product,
      localImageUrl: product.localImageUrl || "/placeholder-image.jpg",
    }));

    await fs.writeFile(fallbackPath, JSON.stringify(fallbackProducts, null, 2));
    console.log(`✅ Fallback data created: ${fallbackPath}`);
  } catch (error) {
    console.error("❌ Error creating fallback data:", error);
    throw error;
  }
}

// Generate sync report
function generateReport(products) {
  console.log("\n📊 SYNC REPORT");
  console.log("=".repeat(50));
  console.log(`Total products: ${products.length}`);
  console.log(
    `Products with images: ${products.filter((p) => p.localImageUrl).length}`
  );
  console.log(
    `Products with prices: ${products.filter((p) => p.price).length}`
  );
  console.log(
    `Products with compare prices: ${
      products.filter((p) => p.compareAtPrice).length
    }`
  );
  console.log(`Unique vendors: ${new Set(products.map((p) => p.vendor)).size}`);
  console.log(
    `Unique product types: ${new Set(products.map((p) => p.productType)).size}`
  );
  console.log(`Last updated: ${new Date().toLocaleString()}`);
  console.log("=".repeat(50));
}

// Main sync function
async function syncProducts() {
  const startTime = Date.now();

  console.log("🚀 Starting Shopify product sync...");
  console.log(`📊 Config: ${config.shopifyStore} (fetching ALL products)`);

  try {
    // Validate configuration
    validateConfig();

    // Ensure directories exist
    await ensureDirectories();

    // Fetch ALL products from Shopify
    const shopifyProducts = await fetchShopifyProducts();

    // Transform product data
    const products = transformProducts(shopifyProducts);

    // Process images
    const processedProducts = await processImages(products);

    // Save products data
    await saveProductsData(processedProducts);

    // Create fallback data
    await createFallbackData(processedProducts);

    // Generate report
    generateReport(processedProducts);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Sync completed successfully in ${duration}s`);
  } catch (error) {
    console.error("\n❌ Sync failed:", error.message);
    process.exit(1);
  }
}

// Run sync if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncProducts()
}

export { syncProducts } 