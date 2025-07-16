import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? './' : '/',
  server: {
    host: "localhost", // Security: only listen on localhost
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
      // Only use mock API in development mode
      ...(mode === 'development' && {
        '@tauri-apps/api': path.resolve(__dirname, 'src/empty-tauri-api.js'),
      }),
    },
  },
  define: {
    // Add environment validation without global pollution
    __DEV__: mode === 'development',
  },
}));
