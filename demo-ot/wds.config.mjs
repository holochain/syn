// import { hmrPlugin, presets } from '@open-wc/dev-server-hmr';
import rollupReplace from '@rollup/plugin-replace';
import { fromRollup } from '@web/dev-server-rollup';

const replace = fromRollup(rollupReplace);

/** Use Hot Module replacement by adding --hmr to the start command */
const hmr = process.argv.includes('--hmr');

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open: true,
  /** Use regular watch mode if HMR is not enabled. */
  watch: !hmr,
  /** Resolve bare module imports */
  nodeResolve: {
    browser: true,
    preferBuiltins: false,
    exportConditions: ['browser', 'development'],
  },

  rootDir: 'public',
  clearTerminalOnReload: false,

  /** Compile JS for older browsers. Requires @web/dev-server-esbuild plugin */
  // esbuildTarget: 'auto'

  /** Set appIndex to enable SPA routing */
  appIndex: 'public/index.html',

  plugins: [
    replace({
      'process.env.HC_PORT': JSON.stringify(process.env.HC_PORT || 8888),
    }),
    /** Use Hot Module Replacement by uncommenting. Requires @open-wc/dev-server-hmr plugin */
    // hmr && hmrPlugin({ exclude: ['**/*/node_modules/**/*'], presets: [presets.litElement] }),
  ],

  // See documentation for all available options
});
