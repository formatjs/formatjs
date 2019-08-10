import * as p from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import {terser} from 'rollup-plugin-terser';
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
  terser({
    include: [/^.+\.min\.js$/],
  }),
].filter(Boolean);

const umdBuildOutput = {
  format: 'umd',
  name: 'ReactIntl',
  banner: copyright,
  exports: 'named',
  sourcemap: true,
  globals: {
    react: 'React',
  },
};

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: p.resolve(`dist/react-intl.min.js`),
        ...umdBuildOutput,
      },
      {
        file: p.resolve(`dist/react-intl.js`),
        ...umdBuildOutput,
      },
      {
        file: 'dist/index.js',
        format: 'cjs',
        banner: copyright,
        sourcemap: true,
      },
      {
        file: 'dist/index.es.js',
        format: 'es',
        banner: copyright,
        sourcemap: true,
      },
    ],
    external: ['react'],
    plugins,
  },
];
