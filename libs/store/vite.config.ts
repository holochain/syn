import { resolve } from 'path';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import dts from 'vite-plugin-dts';

const p = require('./package.json');

export default defineConfig({
  plugins: [topLevelAwait(), wasm(), dts()],
  build: {
    minify: false,
    lib: {
      formats: ['es'],
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'index',
      // the proper extensions will be added
      fileName: 'index',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your libraryjkk
      external: [...Object.keys(p.dependencies)],
      output: {},
    },
  },
});
