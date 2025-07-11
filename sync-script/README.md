# Shopify Product Sync Service

This service automatically syncs product data from your Shopify store to your local server, optimizing images and generating JSON data files for your frontend application.

## Features

- ✅ Fetches **ALL** products from Shopify (no limits)
- ✅ Automatic product labeling (sale, new, top-selling) based on tags
- ✅ Image optimization and local caching
- ✅ Runs every 2 weeks automatically
- ✅ Docker support for easy deployment
- ✅ Rate limiting to avoid API limits
- ✅ Comprehensive logging and error handling
- ✅ Easy deployment script for Ugreen NAS
- ✅ Frontend integration with animated product labels

## Quick Start with Deployment Script

### 1. Configure Environment

```bash
# Copy and edit environment file
cp env.template .env
nano .env  # Add your Shopify credentials
```

### 2. Deploy to Ugreen NAS

```bash
# One-command deployment
./deploy.sh deploy
```

### 3. Manage Service

```bash
# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Manual sync
./deploy.sh sync

# Update service
./deploy.sh update
```

## Manual Setup

### 1. Configure Environment

Copy the environment template:
```bash
cp env.template .env
```

Edit `.env` with your Shopify credentials:
```bash
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-access-token-here
```

### 2. Deploy with Docker

```bash
# Build and start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### 3. Manual Operations

```bash
# Run sync manually
docker-compose exec shopify-sync node sync-products.js

# Check service status
docker-compose ps

# View container logs
docker-compose logs shopify-sync
```

## Shopify Setup

### Create a Private App

1. Go to your Shopify admin
2. Navigate to **Settings** > **Apps and sales channels**
3. Click **Develop apps** > **Create an app**
4. Name it "Product Sync Service"
5. Configure **Admin API access**:
   - `read_products` - Required to fetch product data
   - `read_inventory` - Optional, for inventory levels

### Get Your Access Token

1. After creating the app, go to **API credentials**
2. Copy the **Admin API access token**
3. Add it to your `.env` file

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SHOPIFY_STORE_URL` | Your Shopify store URL | Required |
| `SHOPIFY_ACCESS_TOKEN` | Private app access token | Required |
| `SYNC_SCHEDULE` | Cron schedule for auto-sync | `0 2 */14 * 0` |
| `RUN_ON_START` | Run sync on startup | `false` |
| `ENABLE_SCHEDULER` | Enable automatic scheduling | `true` |
| `TIMEZONE` | Timezone for scheduler | `Europe/Vienna` |

### Product Labels

The service automatically adds labels to products based on their tags:

- **Sale**: `sale`, `discount`, `promo`, `clearance`, `reduced`
- **New**: `new`, `latest`, `fresh`, `recent`
- **Top Selling**: `bestseller`, `top-selling`, `popular`, `trending`

## Deployment on Ugreen NAS

### Prerequisites

1. Docker installed on your Ugreen NAS
2. SSH access to your NAS
3. Shopify store with private app configured

### Step-by-Step Deployment

1. **Upload files to NAS**:
   ```bash
   # Copy the sync-script directory to your NAS
   scp -r sync-script/ user@nas-ip:/path/to/docker/apps/
   ```

2. **SSH into your NAS**:
   ```bash
   ssh user@nas-ip
   cd /path/to/docker/apps/sync-script
   ```

3. **Configure environment**:
   ```bash
   cp env.template .env
   nano .env  # Edit with your Shopify credentials
   ```

4. **Start the service**:
   ```bash
   docker-compose up -d
   ```

5. **Verify deployment**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### File Structure

```
sync-script/
├── sync-products.js      # Main sync logic
├── scheduler.js          # Cron scheduler
├── package.json          # Dependencies
├── Dockerfile           # Docker container
├── docker-compose.yml   # Docker Compose config
├── env.template         # Environment template
└── README.md           # This file

Generated files:
├── data/               # Local data storage
├── logs/              # Application logs
└── ../public/
    ├── data/          # JSON data files
    └── products/      # Optimized images
```

## Monitoring

### Check Service Status

```bash
# Service status
docker-compose ps

# View recent logs
docker-compose logs --tail=50 shopify-sync

# Follow logs in real-time
docker-compose logs -f shopify-sync
```

### Manual Sync

```bash
# Trigger manual sync
docker-compose exec shopify-sync node sync-products.js

# Or send signal to running container
docker kill --signal=SIGUSR1 stoffeya-shopify-sync
```

## Data Output

The service generates the following files:

- `public/data/products.json` - Full product data with metadata
- `public/data/products-simple.json` - Simple product array
- `public/fallback.json` - Fallback data for offline use
- `public/products/` - Optimized product images

### Product Data Structure

```json
{
  "id": 12345,
  "title": "Product Name",
  "handle": "product-name",
  "productUrl": "https://store.myshopify.com/products/product-name",
  "price": "29.99",
  "compareAtPrice": "39.99",
  "vendor": "Brand Name",
  "productType": "Category",
  "tags": "sale,new,popular",
  "label": "sale",
  "localImageUrl": "/products/12345.jpg",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```bash
   sudo chown -R 1000:1000 data/ logs/
   ```

2. **Shopify API Rate Limit**:
   - Service includes automatic rate limiting
   - Reduces concurrent requests if needed

3. **Image Processing Errors**:
   - Check disk space on NAS
   - Verify Sharp dependencies in container

4. **Sync Not Running**:
   ```bash
   # Check scheduler status
   docker-compose exec shopify-sync ps aux
   
   # Check cron schedule
   docker-compose logs shopify-sync | grep "Schedule"
   ```

### Logs

Important log locations:
- Container logs: `docker-compose logs shopify-sync`
- Application logs: `logs/` directory
- Docker system logs: `/var/log/docker/`

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify Shopify API credentials
3. Ensure proper file permissions
4. Check network connectivity to Shopify

## License

This project is for internal use with the STOFFEYA fabric store display system. 