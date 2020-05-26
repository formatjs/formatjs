import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import testRollupConfig from '../../rollup.config';
import commonjs from 'rollup-plugin-commonjs';
const commonjsConfig = commonjs({
  namedExports: {
    lodash: ['pickBy', 'isEmpty', 'isEqual', 'fromPairs'],
  },
});
const resolveConfig = resolve({
  mainFields: ['module', 'main'],
});
const uglifyConfig = uglify();
export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-relativetimeformat.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlRelativeTimeFormat',
    },
    plugins: [resolveConfig, commonjsConfig],
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-relativetimeformat.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlRelativeTimeFormat',
    },
    plugins: [resolveConfig, commonjsConfig, uglifyConfig],
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-relativetimeformat-with-locales.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlRelativeTimeFormat',
    },
    plugins: [resolveConfig, commonjsConfig],
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-relativetimeformat-with-locales.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlRelativeTimeFormat',
    },
    plugins: [resolveConfig, commonjsConfig, uglifyConfig],
  },
  {
    input: './lib/polyfill-locales.js',
    output: {
      sourcemap: true,
      file: 'dist/polyfill-with-locales.js',
      format: 'iife',
    },
    plugins: [resolveConfig, commonjsConfig],
  },
  {
    input: './lib/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill-intl-relativetimeformat.js',
      format: 'umd',
    },
    plugins: [resolveConfig, commonjsConfig],
  },
  {
    input: './dist-es6/polyfill-locales.js',
    output: {
      sourcemap: true,
      file: 'dist/polyfill-with-locales-for-test262.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlPluralRules',
    },
    plugins: [resolveConfig, commonjsConfig],
  },
  ...testRollupConfig,
];
