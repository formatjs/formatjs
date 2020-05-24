import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import testRollupConfig from '../../rollup.config';
const resolveConfig = resolve({
  mainFields: ['module', 'main'],
});
const uglifyConfig = uglify();
export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-listformat.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlListFormat',
    },
    plugins: [resolveConfig],
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-listformat.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlListFormat',
    },
    plugins: [resolveConfig, uglifyConfig],
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-listformat-with-locales.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlListFormat',
    },
    plugins: [resolveConfig],
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-listformat-with-locales.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlListFormat',
    },
    plugins: [resolveConfig, uglifyConfig],
  },
  {
    input: './lib/polyfill-locales.js',
    output: {
      sourcemap: true,
      file: 'dist/polyfill-with-locales.js',
      format: 'iife',
    },
    plugins: [resolveConfig],
  },
  {
    input: './lib/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill-intl-listformat.js',
      format: 'umd',
    },
    plugins: [resolveConfig],
  },
  {
    input: './dist-es6/polyfill-locales.js',
    output: {
      sourcemap: true,
      file: 'dist/polyfill-with-locales-for-test262.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlListFormat',
    },
    plugins: [resolveConfig],
  },
  ...testRollupConfig,
];
