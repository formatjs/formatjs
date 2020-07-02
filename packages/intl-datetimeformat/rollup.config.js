import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import json from '@rollup/plugin-json';
import {generateTestConfig} from '../../rollup.config';
// import * as path from 'path';
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
const jsonConfig = json();

const browserFriendlyTests = [];
//   'tests/unit-zh-TW.test.ts',
//   'tests/value-tonumber.test.ts',
//   'tests/notation-compact-ko-KR.test.ts',
//   'tests/notation-compact-zh-TW.test.ts',
//   'tests/signDisplay-zh-TW.test.ts',
//   'tests/signDisplay-currency-zh-TW.test.ts',
//   // 'tests/currency-code.test.ts',
// ].map(fn => path.resolve(__dirname, fn));

export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-datetimeformat.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlDateTimeFormat',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-datetimeformat.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlDateTimeFormat',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig, uglifyConfig],
  },
  {
    input: './lib/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill.js',
      format: 'umd',
      name: 'IntlDateTimeFormat',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  {
    input: './tests/test262-main.js',
    output: {
      sourcemap: true,
      file: 'tests/test262-polyfill.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlDateTimeFormat',
    },
    plugins: [
      resolve({
        // For test262, we want to use ES6 distribution to avoid a myriad of errors
        // that could be introduced by transpiled code.
        mainFields: ['module:es6'],
      }),
      commonjsConfig,
      jsonConfig,
    ],
  },
  ...browserFriendlyTests.map(generateTestConfig),
];
