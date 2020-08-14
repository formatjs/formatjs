import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';

export default {
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.version': JSON.stringify(''),
    }),
    json(),
    alias({
      entries: {
        'intl-messageformat-parser': 'intl-messageformat-parser/dummy',
      },
    }),
    resolve({
      mainFields: ['module', 'main'],
    }),
    commonjs(),
  ],
  external: ['react'],
};
