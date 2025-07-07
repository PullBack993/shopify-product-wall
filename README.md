# 🛍️ Shopify Product Wall

A beautiful, Pinterest-style product wall for displaying Shopify products in fullscreen mode. Perfect for digital displays, retail environments, and product showcases.

## ✨ Features

- **📱 Fullscreen Display**: Optimized for vertical displays and Raspberry Pi
- **🔄 Auto-Rotation**: Smart product rotation with smooth transitions
- **📱 QR Codes**: Each product includes a QR code for mobile access
- **🌐 Offline Support**: Works offline with multiple fallback layers
- **🎨 Modern UI**: Beautiful gradient backgrounds and smooth animations
- **⚡ Performance**: Optimized for Raspberry Pi with image compression
- **🔧 Auto-Sync**: Scheduled product updates from Shopify
- **📊 Smart Caching**: Multiple caching layers for reliability

## 🏗️ Architecture

```
Shopify API → Sync Script → Local Storage → Vue 3 App
```

**Key Components:**
- **Frontend**: Vue 3 + Vite for fast, reactive UI
- **Sync Script**: Node.js script for Shopify API integration
- **Image Optimization**: Sharp for Pi-optimized images
- **Caching**: Service Worker + localStorage + fallback data
- **Rotation**: Smart algorithm for product display cycling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Shopify store with Admin API access
- Raspberry Pi (optional, works on any device)

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd shopify-product-wall

# Install frontend dependencies
npm install

# Install sync script dependencies
cd sync-script
npm install
cd ..
```

### 2. Configuration

```bash
# Copy environment template
cp env.template .env

# Edit .env file with your Shopify credentials
nano .env
```

Required environment variables:
```env
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-admin-api-access-token
```

### 3. Initial Setup

```bash
# Run initial product sync
npm run sync

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

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

1. **Create a Private App** in your Shopify admin
2. **Enable Admin API access** with these permissions:
   - `read_products`
   - `read_product_listings`
3. **Copy the Admin API access token** to your `.env` file

## 📱 Usage

### Development Mode

```bash
# Start development server
npm run dev

# Run sync manually
npm run sync

# Start scheduler (for automatic syncing)
node sync-script/scheduler.js
```

### Production Mode

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Start sync scheduler
node sync-script/scheduler.js
```

## 🖥️ Raspberry Pi Deployment

### 1. Prepare Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
npm install -g pm2
```

### 2. Deploy Application

```bash
# Clone and setup
git clone <repository-url> /home/pi/product-wall
cd /home/pi/product-wall

# Install dependencies
npm install
cd sync-script && npm install && cd ..

# Setup environment
cp env.template .env
nano .env  # Add your Shopify credentials

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Kiosk Mode Setup

```bash
# Install Chromium
sudo apt install -y chromium-browser

# Auto-start in kiosk mode
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/kiosk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Kiosk
Exec=chromium-browser --start-fullscreen --kiosk --incognito --noerrdialogs --disable-translate --no-first-run --fast --fast-start --disable-infobars --disable-features=TranslateUI --disk-cache-dir=/dev/null --password-store=basic http://localhost:3000
EOF
```

## 🎨 Customization

### Display Settings

Edit `src/composables/useRotation.js`:
```javascript
const options = {
  gridSize: 12,           // Products per screen
  rotationInterval: 15000, // 15 seconds
  shuffleOnRotation: true  // Randomize order
}
```

### Styling

Edit `src/style.css` and component styles:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #4ade80;
}
```

### Store Title

Edit `src/App.vue`:
```javascript
const storeTitle = ref('YOUR STORE NAME')
```

## 🔄 Sync Process

The sync script automatically:

1. **Fetches** active products from Shopify
2. **Downloads** and optimizes product images
3. **Saves** data to local JSON files
4. **Creates** fallback data for offline use
5. **Generates** sync reports

### Manual Sync

```bash
# One-time sync
npm run sync

# Sync with custom settings
MAX_PRODUCTS=50 npm run sync
```

### Scheduled Sync

```bash
# Start scheduler
node sync-script/scheduler.js

# Custom schedule (every 4 hours)
SYNC_SCHEDULE="0 */4 * * *" node sync-script/scheduler.js
```

## 📊 Monitoring

### View Logs

```bash
# Application logs
pm2 logs product-wall

# Sync logs
pm2 logs sync-scheduler
```

### Check Status

```bash
# PM2 status
pm2 status

# Restart services
pm2 restart all
```

## 🛠️ Troubleshooting

### Common Issues

**❌ Sync fails with 401 error**
- Check your `SHOPIFY_ACCESS_TOKEN`
- Verify API permissions in Shopify admin

**❌ Images not loading**
- Check network connectivity
- Verify image URLs in product data
- Check local storage permissions

**❌ App shows "No products available"**
- Run manual sync: `npm run sync`
- Check fallback data exists
- Verify product data format

### Performance Issues

**🐌 Slow on Raspberry Pi**
- Reduce `MAX_PRODUCTS` in `.env`
- Lower `IMAGE_SIZE` and `IMAGE_QUALITY`
- Increase `CONCURRENCY` cautiously

**💾 Storage Issues**
- Clean old images: `rm -rf public/products/*`
- Reduce image quality in sync script
- Use smaller grid size

## 🎯 Best Practices

### For Retail Displays

1. **Use portrait orientation** for better product visibility
2. **Set up automatic updates** during off-hours
3. **Monitor network connectivity** for sync reliability
4. **Use UPS** for power stability
5. **Regular maintenance** checks

### For Development

1. **Test with sample data** first
2. **Use development mode** for styling
3. **Monitor performance** on target hardware
4. **Backup configurations** before changes

## 🔐 Security

- Store API tokens securely
- Use HTTPS in production
- Restrict API permissions
- Regular security updates
- Monitor access logs

## 📄 License

MIT License - feel free to customize for your needs!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review error logs
- Test with sample data
- Verify API credentials

---

**Made with ❤️ for beautiful product displays!** 