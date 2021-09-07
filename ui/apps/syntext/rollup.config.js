import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';
import builtins from 'rollup-plugin-node-builtins';
import copy from 'copy';
import os from 'os';

const production = !process.env.ROLLUP_WATCH;

const HC_PORT = process.env.HC_PORT || 8888;
const PUBLIC_FOLDER = production
  ? 'public'
  : `${os.tmpdir()}/public-${HC_PORT}`;

copy('public/*', PUBLIC_FOLDER, function (err, files) {
  if (err) throw err;
  // `files` is an array of the files that were copied
});

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn(
        'npm',
        ['run', 'start', '--', '--dev'],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
          env: {
            ...process.env,
            PUBLIC_FOLDER,
          },
        }
      );

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    },
  };
}

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: `${PUBLIC_FOLDER}/build/bundle.js`,
  },
  plugins: [
    replace({
      'process.env.HC_PORT': JSON.stringify(process.env.HC_PORT),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE),
      'process.env.APP_HOST': JSON.stringify(process.env.APP_HOST),
    }),
    svelte({
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: 'bundle.css' }),
    builtins(),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload(PUBLIC_FOLDER),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
