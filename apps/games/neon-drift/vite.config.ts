import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    minify: 'esbuild',
    rollupOptions: {
      input: 'index.html',
    },
  },
  plugins: [wasm(), topLevelAwait()],
  server: {
    port: 5173,
    open: false,
  },
});
