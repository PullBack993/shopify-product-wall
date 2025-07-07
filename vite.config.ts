import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 3000,
    cors: true,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    target: "es2015",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "@vueuse/core"],
          qrcode: ["qrcode"],
          gsap: ["gsap"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["vue", "@vueuse/core", "qrcode", "gsap"],
  },
}) 