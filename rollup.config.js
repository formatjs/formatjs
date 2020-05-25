import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import json from '@rollup/plugin-json';
import {sync as globSync} from 'glob';
import {basename} from 'path';

const testFiles = globSync('./tests/*.test.ts');

export function generateTestConfig(fn) {
  return {
    input: fn,
    output: {
      sourcemap: true,
      file: `tests-karma/${basename(fn)}.js`,
      format: 'umd',
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('test'),
        'process.version': JSON.stringify(''),
      }),
      json(),
      resolve({
        customResolveOptions: {
          '@formatjs/intl-pluralrules': './packages/intl-pluralrules',
          '@formatjs/intl-relativetimeformat':
            './packages/intl-relativetimeformat',
          '@formatjs/intl-utils': './packages/intl-utils',
          'intl-messageformat': './packages/intl-messageformat',
        },
      }),
      typescript({
        // This is meant to be import and used in sub-packages, where a tsconfig.esm.json
        // is assumed to exist.
        tsconfig: './tsconfig.esm.json',
        tsconfigDefaults: {
          compilerOptions: {
            declaration: false,
            declarationMap: false,
          },
        },
        check: false,
      }),
      commonjs(),
    ],
  };
}

export default testFiles.map(generateTestConfig);
