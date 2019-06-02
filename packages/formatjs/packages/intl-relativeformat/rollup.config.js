import { uglify } from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import testRollupConfig from '../../rollup.config'

const resolveConfig = resolve({
  mainFields: ['module', 'main']
});
const uglifyConfig = uglify();
export default [
  {
    input: './lib/main.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-relativeformat.js',
      format: 'umd',
      name: 'IntlRelativeFormat'
    },
    plugins: [resolveConfig]
  },
  {
    input: './lib/main.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-relativeformat.min.js',
      format: 'umd',
      name: 'IntlRelativeFormat'
    },
    plugins: [resolveConfig, uglifyConfig]
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-relativeformat-with-locales.js',
      format: 'umd',
      name: 'IntlRelativeFormat'
    },
    plugins: [resolveConfig]
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-relativeformat-with-locales.min.js',
      format: 'umd',
      name: 'IntlRelativeFormat'
    },
    plugins: [resolveConfig, uglifyConfig]
  },
  ...testRollupConfig
];