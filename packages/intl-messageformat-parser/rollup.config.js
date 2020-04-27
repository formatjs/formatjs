import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';

const resolveConfig = resolve({
  mainFields: ['module', 'main'],
});
const uglifyConfig = uglify();
export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-messageformat-parser.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlMessageFormatParser',
    },
    plugins: [resolveConfig],
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-messageformat-parser.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlMessageFormatParser',
    },
    plugins: [resolveConfig, uglifyConfig],
  },
];
