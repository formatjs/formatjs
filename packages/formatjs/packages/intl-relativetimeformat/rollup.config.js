import { uglify } from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';

const resolveConfig = resolve({
  mainFields: ['module', 'main']
});
const uglifyConfig = uglify();
export default [
  {
    input: './dist/index.mjs',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-relativetimeformat.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlRelativeTimeFormat'
    },
    plugins: [resolveConfig]
  },
  {
    input: './dist/index.mjs',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-relativetimeformat.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlRelativeTimeFormat'
    },
    plugins: [resolveConfig, uglifyConfig]
  },
  {
    input: './dist/locales.mjs',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-relativetimeformat-with-locales.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlRelativeTimeFormat'
    },
    plugins: [resolveConfig]
  },
  {
    input: './dist/locales.mjs',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-relativetimeformat-with-locales.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlRelativeTimeFormat'
    },
    plugins: [resolveConfig, uglifyConfig]
  },
  {
    input: './dist/polyfill-locales.mjs',
    output: {
      sourcemap: true,
      file: 'dist/polyfill-with-locales.js',
      format: 'iife'
    },
    plugins: [resolveConfig]
  }
];