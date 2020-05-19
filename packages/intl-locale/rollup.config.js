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
      file: 'dist/umd/intl-locale.js',
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
      file: 'dist/umd/intl-locale.min.js',
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
    input: './dist-es6/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist-es6/umd/polyfill.js',
      format: 'umd'
    },
    plugins: [resolveConfig, jsonConfig]
  },
];