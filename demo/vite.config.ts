import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  optimizeDeps: {
    disabled: true,
  },
  plugins: [svelte(), wasm()],
});
