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
      file: 'dist/umd/intl-displaynames.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlDisplayNames'
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig]
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-displaynames.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlDisplayNames'
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
  // == Slow ==
  // {
  //   input: './polyfill-locales.js',
  //   output: {
  //     sourcemap: true,
  //     file: 'dist/polyfill-with-locales.js',
  //     format: 'umd',
  //     exports: 'named',
  //     name: 'IntlDisplayNames'
  //   },
  //   plugins: [resolveConfig, commonjsConfig, jsonConfig]
  // },
  {
    input: './dist-es6/polyfill-locales-for-test262.js',
    output: {
      sourcemap: true,
      file: 'dist/polyfill-with-locales-for-test262.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlDisplayNames'
    },
    plugins: [resolve({
      mainFields: ['jsnext', 'module', 'main']
    }), commonjsConfig, jsonConfig]
  },
];
