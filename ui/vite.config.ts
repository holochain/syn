import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import wasm from 'vite-plugin-wasm';

const components = [
  'dialog',
  'dropdown',
  'menu',
  'menu-item',
  'checkbox',
  'divider',
  'menu-label',
  'option',
  'select',
  'tooltip',
  'card',
  'icon-button',
  'button',
  'icon',
  'alert',
  'input',
  'spinner',
  'avatar',
  'skeleton',
];
const exclude = components.map(
  c => `@shoelace-style/shoelace/dist/components/${c}/${c}.js`
);
export default defineConfig({
  optimizeDeps: {
    exclude: [
      ...exclude,
      '@holochain-open-dev/elements/dist/elements/display-error.js',
      '@automerge/automerge-wasm',
    ],
  },

  plugins: [svelte(), wasm()],
});
