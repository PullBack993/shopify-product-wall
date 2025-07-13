# API Configuration Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_PRODUCTS_ENDPOINT=/products
VITE_API_TIMEOUT=10000
VITE_USE_API=false

# Development settings - use local JSON in development
VITE_DEV_USE_LOCAL_JSON=true
```

## Configuration Options

### `VITE_API_BASE_URL`
- The base URL of your backend API
- Example: `https://your-backend-api.com/api`

### `VITE_API_PRODUCTS_ENDPOINT`
- The endpoint to fetch products from
- Default: `/products`

### `VITE_API_TIMEOUT`
- Request timeout in milliseconds
- Default: `10000` (10 seconds)

### `VITE_USE_API`
- Set to `true` to use the backend API
- Set to `false` to use local JSON files
- Default: `false`

### `VITE_DEV_USE_LOCAL_JSON`
- Force use of local JSON files in development
- Set to `true` for development with local files
- Set to `false` to test API in development
- Default: `true`

## Product Distribution System

The system now distributes products uniquely across different views:

- **Marquee View**: Shows 20 products (products 1-20)
- **Grid View**: Shows 15 products (products 21-35)
- **Slideshow View**: Shows 15 products (products 36-50)

**Total: 50 products per cycle** - perfect for your product count!

After all views are shown, the system cycles back to the beginning with the next set of products.

## API Response Format

Your backend API should return products in one of these formats:

```json
{
  "products": [
    {
      "id": 12345,
      "title": "Product Name",
      "handle": "product-handle",
      "productUrl": "https://your-shop.com/products/product-handle",
      "imageUrl": "https://cdn.example.com/image.jpg",
      "imageAlt": "Product description",
      "price": "29.99",
      "compareAtPrice": "39.99",
      "vendor": "Your Store",
      "productType": "Category",
      "tags": "tag1, tag2, tag3",
      "localImageUrl": "/products/12345.jpg",
      "description": "Product description",
      "status": "active"
    }
  ]
}
```

Or simply an array of products:

```json
[
  {
    "id": 12345,
    // ... product fields
  }
]
```

## Development vs Production

### Development Mode
- Set `VITE_USE_API=false` and `VITE_DEV_USE_LOCAL_JSON=true`
- Uses local `/data/products.json` file
- Keyboard shortcuts available (1-4 for views, A for auto-switch, R for reset)

### Production Mode
- Set `VITE_USE_API=true` and `VITE_DEV_USE_LOCAL_JSON=false`
- Fetches from your backend API
- Falls back to cache if API is unavailable
- Falls back to `/fallback.json` if cache is empty

## Keyboard Shortcuts (Development Only)

- **1-3**: Switch to specific view (1=Marquee, 2=Grid, 3=Slideshow)
- **A**: Toggle auto-switch between views
- **Arrow Keys**: Navigate between views manually
- **R**: Reset product distribution to beginning 