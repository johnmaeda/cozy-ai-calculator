import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    // Output directory for production build
    outDir: 'dist',
    // Generate sourcemaps for production
    sourcemap: true,
    // Minify the build
    minify: 'terser',
    // Configure chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Configure rollup options
    rollupOptions: {
      output: {
        // Separate vendor chunks for better caching
        manualChunks: {
          vendor: ['vite']
        }
      }
    }
  },
  // Configure public directory for static assets
  publicDir: 'public'
}) 