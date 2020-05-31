import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import json from '@rollup/plugin-json';
import testRollupConfig from '../../rollup.config';
import commonjs from 'rollup-plugin-commonjs';

const resolveConfig = resolve({
  mainFields: ['module', 'main'],
});
const uglifyConfig = uglify();
const jsonConfig = json();
const commonjsConfig = commonjs({
  namedExports: {
    lodash: ['pickBy', 'isEmpty', 'isEqual', 'fromPairs'],
  },
});
export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-locale.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlLocale',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-locale.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlLocale',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig, uglifyConfig],
  },
  {
    input: './lib/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill.js',
      format: 'umd',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  {
    input: './dist-es6/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist-es6/umd/polyfill.js',
      format: 'umd',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  ...testRollupConfig,
];
