import * as p from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript2';

const copyright = `/*
 * Copyright ${new Date().getFullYear()}, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
`;

const plugins = [
  replace({
    replaces: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  }),
  nodeResolve(),
  commonjs({
    sourcemap: true,
  }),
  typescript({
    rollupCommonJSResolveHack: true,
  }),
].filter(Boolean);

export default [
  {
    input: p.resolve('src/index.ts'),
    output: [
      {
        file: p.resolve('dist/index.es.js'),
        format: 'es',
        banner: copyright,
        sourcemap: true,
      },
    ],
    external: ['react'],
    plugins,
  },
];
