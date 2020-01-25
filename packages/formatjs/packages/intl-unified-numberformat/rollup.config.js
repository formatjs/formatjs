import { uglify } from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import json from '@rollup/plugin-json'
import commonjs from 'rollup-plugin-commonjs'

const resolveConfig = resolve({
  mainFields: ['module', 'main']
});
const uglifyConfig = uglify();
const jsonConfig = json()
const commonjsConfig = commonjs();
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
    plugins: [resolveConfig, commonjsConfig, jsonConfig]
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
    plugins: [resolveConfig, commonjsConfig, jsonConfig, uglifyConfig]
  },
  {
    input: './lib/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill.js',
      format: 'umd'
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig]
  },
  {
    input: './dist-es6/polyfill-locales.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill-with-locales.js',
      format: 'umd',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig]
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
    plugins: [resolve({
      // For test262, we want to use ES6 distribution to avoid a myriad of errors
      // that could be introduced by transpiled code.
      mainFields: ['jsnext']
    }), commonjsConfig, jsonConfig]
  },
];
