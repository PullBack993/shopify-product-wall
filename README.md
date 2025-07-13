# 🛍️ STOFFEYA_SCREEN - Shopify Product Wall

A modern, fullscreen product display system built with Vue 3 and TypeScript. Perfect for retail displays, digital signage, and product showcases.

## ✨ Features

- **🎯 Fullscreen Display**: Optimized for vertical displays and kiosk mode
- **🔄 Smart Rotation**: Auto-rotating products with smooth transitions
- **📱 QR Integration**: Each product includes a QR code for mobile access
- **🌐 Offline Support**: Multiple fallback layers for reliability
- **⚡ Performance**: Optimized for Raspberry Pi and low-power devices
- **🔧 Auto-Sync**: Scheduled product updates from Shopify API
- **📊 Smart Caching**: Service worker with intelligent cache management
- **🎨 Modern UI**: Beautiful gradients and smooth animations

## 🏗️ Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Styling**: SCSS with CSS custom properties
- **Animations**: GSAP for smooth transitions
- **QR Codes**: QRCode.js for product links
- **Sync**: Node.js with Shopify Admin API
- **Image Processing**: Sharp for optimization
- **Deployment**: Docker + PM2 for production

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Shopify store with Admin API access
- Git

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd STOFFEYA_SCREEN

# Install dependencies
npm install

# Install sync script dependencies
cd sync-script && npm install && cd ..
```

### 2. Configuration

```bash
# Copy environment template
cp env.template .env

# Edit with your Shopify credentials
nano .env
```

**Required Environment Variables:**
```env
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-admin-api-access-token
```

### 3. Development

```bash
# Start development server
npm run dev

# Run initial product sync
npm run sync

# Build for production
npm run build
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SHOPIFY_STORE_URL` | ✅ | - | Your Shopify store URL |
| `SHOPIFY_ACCESS_TOKEN` | ✅ | - | Admin API access token |
| `SYNC_SCHEDULE` | ❌ | `0 2 * * 0` | Cron schedule for syncing |
| `RUN_ON_START` | ❌ | `true` | Run sync on startup |
| `TIMEZONE` | ❌ | `America/New_York` | Timezone for scheduling |
| `MAX_PRODUCTS` | ❌ | `100` | Maximum products to fetch |
| `IMAGE_SIZE` | ❌ | `400` | Optimized image size |
| `IMAGE_QUALITY` | ❌ | `85` | JPEG quality (1-100) |
| `CONCURRENCY` | ❌ | `3` | Image processing concurrency |

### Shopify API Setup

1. **Create Private App** in Shopify admin
2. **Enable Admin API** with permissions:
   - `read_products`
   - `read_product_listings`
3. **Copy access token** to `.env` file

## 📱 Usage

### Development Commands

```bash
# Development server
npm run dev

# Manual sync
npm run sync

# Build and preview
npm run build
npm run preview

# Deploy with cache update
npm run deploy
```

### Production Deployment

```bash
# Build for production
npm run build

# Start sync scheduler
node sync-script/scheduler.js

# Docker deployment
cd sync-script
docker-compose up -d
```

## 🖥️ Raspberry Pi Setup

### System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
npm install -g pm2
```

### Application Deployment

```bash
# Clone and setup
git clone <repository-url> /home/pi/stoffeya-screen
cd /home/pi/stoffeya-screen

# Install dependencies
npm install
cd sync-script && npm install && cd ..

# Configure environment
cp env.template .env
nano .env

# Build and start
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Kiosk Mode

```bash
# Install Chromium
sudo apt install -y chromium-browser

# Auto-start configuration
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/kiosk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=STOFFEYA_SCREEN
Exec=chromium-browser --start-fullscreen --kiosk --incognito --noerrdialogs --disable-translate --no-first-run --fast --fast-start --disable-infobars --disable-features=TranslateUI --disk-cache-dir=/dev/null --password-store=basic http://localhost:3000
EOF
```

## 🎨 Customization

### Display Settings

Edit `src/composables/useGridLayout.ts`:
```typescript
const options = {
  gridSize: 12,           // Products per screen
  rotationInterval: 15000, // 15 seconds
  shuffleOnRotation: true  // Randomize order
}
```

### Styling

Edit `src/style.css`:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #4ade80;
  --background-gradient: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}
```

### Store Configuration

Edit `src/App.vue`:
```typescript
const storeConfig = {
  title: 'YOUR STORE NAME',
  logo: '/path/to/logo.png',
  theme: 'dark' // or 'light'
}
```

## 🔄 Sync Process

### Manual Sync

```bash
# One-time sync
npm run sync

# Custom settings
MAX_PRODUCTS=50 npm run sync
```

### Automated Sync

```bash
# Start scheduler
node sync-script/scheduler.js

# Custom schedule (every 4 hours)
SYNC_SCHEDULE="0 */4 * * *" node sync-script/scheduler.js
```

### Sync Features

- **Smart Image Optimization**: Compresses images for Pi performance
- **Incremental Updates**: Only syncs changed products
- **Error Recovery**: Automatic retry on failures
- **Progress Tracking**: Real-time sync status
- **Fallback Data**: Ensures offline functionality

## 🔧 Service Worker

### Features

- **🔄 Auto-Reset**: Cache versioning for deployments
- **🚫 Dev Mode**: Disabled in development
- **📦 Smart Caching**: Different strategies per content type
- **🔄 Version Management**: Automatic cache updates

### Cache Strategy

- **Static Assets**: Cache-first strategy
- **Dynamic Content**: Network-first strategy
- **Images**: Bypassed (Shopify CDN)
- **Fallback**: Uses `/public/fallback.json`

### Manual Cache Management

```javascript
// Clear all caches
navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });

// Get cache version
navigator.serviceWorker.controller?.postMessage({ type: 'GET_VERSION' });
```

## 📊 Monitoring

### PM2 Commands

```bash
# View logs
pm2 logs stoffeya-screen

# Check status
pm2 status

# Restart services
pm2 restart all
```

### Docker Monitoring

```bash
# View container logs
docker-compose logs -f

# Check container status
docker-compose ps
```

## 🛠️ Troubleshooting

### Common Issues

**❌ Sync fails with 401 error**
```bash
# Check API token
echo $SHOPIFY_ACCESS_TOKEN

# Verify permissions in Shopify admin
```

**❌ Images not loading**
```bash
# Check network connectivity
ping your-store.myshopify.com

# Verify product data
cat public/data/products.json | head -20
```

**❌ App shows "No products available"**
```bash
# Run manual sync
npm run sync

# Check fallback data
ls -la public/fallback.json
```

### Performance Optimization

**🐌 Slow on Raspberry Pi**
```bash
# Reduce product count
MAX_PRODUCTS=50 npm run sync

# Lower image quality
IMAGE_QUALITY=70 npm run sync
```

**💾 Storage Issues**
```bash
# Clean old images
rm -rf public/products/*

# Reduce image size
IMAGE_SIZE=300 npm run sync
```

## 🎯 Best Practices

### For Production

1. **Use UPS** for power stability
2. **Monitor network** connectivity
3. **Schedule updates** during off-hours
4. **Regular maintenance** checks
5. **Backup configurations**

### For Development

1. **Test with sample data** first
2. **Use development mode** for styling
3. **Monitor performance** on target hardware
4. **Version control** all changes

## 🔐 Security

- Store API tokens securely
- Use HTTPS in production
- Restrict API permissions
- Regular security updates
- Monitor access logs

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

For issues and questions:
- Check the troubleshooting section above
- Review error logs in PM2/Docker
- Test with sample data first
- Verify API credentials

---

**Built with ❤️ for beautiful product displays!** 