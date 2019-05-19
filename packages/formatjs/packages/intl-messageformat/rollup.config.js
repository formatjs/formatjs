import { uglify } from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
const resolveConfig = resolve({
  mainFields: ['jsnext:main', 'module', 'main']
});
const uglifyConfig = uglify();
export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-messageformat.js',
      format: 'umd',
      name: 'IntlMessageFormat'
    },
    plugins: [resolveConfig]
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-messageformat-with-locales.js',
      format: 'umd',
      name: 'IntlMessageFormat'
    },
    plugins: [resolveConfig]
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-messageformat.min.js',
      format: 'umd',
      name: 'IntlMessageFormat'
    },
    plugins: [resolveConfig, uglifyConfig]
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-messageformat-with-locales.min.js',
      format: 'umd',
      name: 'IntlMessageFormat'
    },
    plugins: [resolveConfig, uglifyConfig]
  }
];
