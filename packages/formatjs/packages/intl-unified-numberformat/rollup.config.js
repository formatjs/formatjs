import { uglify } from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import json from '@rollup/plugin-json'

const resolveConfig = resolve({
  mainFields: ['module', 'main']
});
const uglifyConfig = uglify();
const jsonConfig = json()
export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-unified-numberformat.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlUnifiedNumberFormat'
    },
    plugins: [resolveConfig, jsonConfig]
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-unified-numberformat.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlUnifiedNumberFormat'
    },
    plugins: [resolveConfig, jsonConfig, uglifyConfig]
  },
  {
    input: './lib/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill.js',
      format: 'umd'
    },
    plugins: [resolveConfig, jsonConfig]
  },
  {
    input: './dist-es6/polyfill-locales.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill-with-locales.js',
      format: 'umd',
    },
    plugins: [resolveConfig, jsonConfig]
  },
  {
    input: './dist-es6/polyfill-locales.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill-with-locales.js',
      format: 'umd',
    },
    plugins: [resolveConfig, jsonConfig]
  },
  {
    input: './dist-es6/polyfill-locales.js',
    output: {
      sourcemap: true,
      file: 'dist/polyfill-with-locales-for-test262.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlUnifiedNumberFormat'
    },
    plugins: [resolveConfig, jsonConfig]
  },
];