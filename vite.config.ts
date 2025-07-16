import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? './' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Always use mock for web development, Tauri will use real API at runtime
      '@tauri-apps/api': path.resolve(__dirname, 'src/empty-tauri-api.js'),
    },
  },
  define: {
    // Ensure require is available for the storage utility
    global: 'globalThis',
  },
}));
