#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { promises as fs } from 'fs'
import { createRequire } from 'module'
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  shopifyStore: process.env.SHOPIFY_STORE_URL,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  productionUrl: process.env.SHOPIFY_PRODUCTION_URL || "stoffeya.at",
  outputDir: join(__dirname, "..", "public", "data"),
  concurrency: 5, // Increased since we're not processing images
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
    while (hasNextPage) {
      pageCount++;
      const params = {
        limit: 250, // Maximum allowed per request
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
      await new Promise((resolve) => setTimeout(resolve, 100));
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

// Transform product data - keep ALL fields and use Shopify URLs directly
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

      // Return ALL product fields from Shopify
      return {
        // Basic product info
        id: product.id,
        title: product.title,
        handle: product.handle,
        body_html: product.body_html,
        vendor: product.vendor,
        product_type: product.product_type,
        created_at: product.created_at,
        updated_at: product.updated_at,
        published_at: product.published_at,
        template_suffix: product.template_suffix,
        status: product.status,
        published_scope: product.published_scope,
        tags: product.tags,
        admin_graphql_api_id: product.admin_graphql_api_id,

        // Variants (ALL variants with ALL fields)
        variants: product.variants || [],

        // Options
        options: product.options || [],

        // Images (ALL images with original Shopify URLs)
        images: product.images || [],
        image: product.image || null,

        // Computed fields for convenience
        productUrl: `https://${config.productionUrl}/products/${product.handle}`,
        imageUrl: firstImage ? firstImage.src : null,
        imageAlt: firstImage ? firstImage.alt : null,
        price: firstVariant ? firstVariant.price : null,
        compareAtPrice: firstVariant ? firstVariant.compare_at_price : null,

        // Additional metadata
        totalInventory: product.variants
          ? product.variants.reduce(
              (sum, variant) => sum + (variant.inventory_quantity || 0),
              0
            )
          : 0,
        variantCount: product.variants ? product.variants.length : 0,
        imageCount: product.images ? product.images.length : 0,
        hasMultipleVariants: product.variants
          ? product.variants.length > 1
          : false,
        isOnSale: firstVariant
          ? firstVariant.compare_at_price &&
            parseFloat(firstVariant.compare_at_price) >
              parseFloat(firstVariant.price)
          : false,

        // Keep original Shopify data for reference
        _shopifyData: product,
      };
    })
    .filter((product) => product.imageUrl); // Only include products with images

  console.log(`✅ Transformed ${products.length} products (with images)`);
  console.log(`📊 Total products from Shopify: ${shopifyProducts.length}`);
  console.log(`📊 Products with images: ${products.length}`);
  console.log(
    `📊 Products without images: ${shopifyProducts.length - products.length}`
  );

  return products;
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
        syncVersion: "3.0.0",
        fetchedAllFields: true,
        imagesCachedOnFrontend: true,
        vendors: [...new Set(products.map((p) => p.vendor))],
        productTypes: [...new Set(products.map((p) => p.product_type))],
        totalVariants: products.reduce((sum, p) => sum + p.variantCount, 0),
        totalImages: products.reduce((sum, p) => sum + p.imageCount, 0),
        productsOnSale: products.filter((p) => p.isOnSale).length,
        productsWithMultipleVariants: products.filter(
          (p) => p.hasMultipleVariants
        ).length,
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

// Create fallback data with Shopify URLs
async function createFallbackData(products) {
  console.log("🔄 Creating fallback data...");

  try {
    const fallbackPath = join(__dirname, "..", "public", "fallback.json");

    // Create a subset of products for fallback
    const fallbackProducts = products.slice(0, 12).map((product) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      productUrl: product.productUrl,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      vendor: product.vendor,
      product_type: product.product_type,
      isOnSale: product.isOnSale,
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
  console.log("=".repeat(60));
  console.log(`Total products: ${products.length}`);
  console.log(
    `Products with images: ${products.filter((p) => p.imageUrl).length}`
  );
  console.log(
    `Products with prices: ${products.filter((p) => p.price).length}`
  );
  console.log(`Products on sale: ${products.filter((p) => p.isOnSale).length}`);
  console.log(
    `Products with multiple variants: ${
      products.filter((p) => p.hasMultipleVariants).length
    }`
  );
  console.log(`Unique vendors: ${new Set(products.map((p) => p.vendor)).size}`);
  console.log(
    `Unique product types: ${new Set(products.map((p) => p.product_type)).size}`
  );
  console.log(
    `Total variants: ${products.reduce((sum, p) => sum + p.variantCount, 0)}`
  );
  console.log(
    `Total images: ${products.reduce((sum, p) => sum + p.imageCount, 0)}`
  );
  console.log(
    `Total inventory: ${products.reduce((sum, p) => sum + p.totalInventory, 0)}`
  );
  console.log(`Image processing: Skipped (using Shopify URLs directly)`);
  console.log(`Image caching: Frontend implementation`);
  console.log(`Last updated: ${new Date().toLocaleString()}`);
  console.log("=".repeat(60));
}

// Main sync function
async function syncProducts() {
  const startTime = Date.now();

  console.log("🚀 Starting Shopify product sync...");
  console.log(
    `📊 Config: ${config.shopifyStore} (fetching ALL products with ALL fields)`
  );
  console.log(
    `🖼️  Images: Using Shopify URLs directly (no download/compression)`
  );
  console.log(`💾 Caching: Frontend implementation for offline access`);

  try {
    // Validate configuration
    validateConfig();

    // Ensure directories exist
    await ensureDirectories();

    // Fetch ALL products from Shopify
    const shopifyProducts = await fetchShopifyProducts();

    // Transform product data (keep ALL fields)
    const products = transformProducts(shopifyProducts);

    // Save products data
    await saveProductsData(products);

    // Create fallback data
    await createFallbackData(products);

    // Generate report
    generateReport(products);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Sync completed successfully in ${duration}s`);
    console.log(`🚀 Ready to deploy with ${products.length} products!`);
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