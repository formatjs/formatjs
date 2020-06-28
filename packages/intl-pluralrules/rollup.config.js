import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import testRollupConfig from '../../rollup.config';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
const jsonConfig = json();
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
      file: 'dist/umd/intl-pluralrules.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlPluralRules',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-pluralrules.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlPluralRules',
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
    input: './dist-es6/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill-with-locales.js',
      format: 'umd',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  {
    input: './dist-es6/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/polyfill-with-locales-for-test262.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlPluralRules',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  ...testRollupConfig,
];
