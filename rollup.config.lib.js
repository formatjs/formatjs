import * as p from 'path';
import babel from 'rollup-plugin-babel';

const copyright = `/*
 * Copyright ${new Date().getFullYear()}, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
`;

export default {
  input: p.resolve('src/index.js'),
  output: [
    {file: 'lib/index.js', format: 'cjs'},
    {file: 'lib/index.es.js', format: 'es'},
  ],
  banner: copyright,
  external: [
    'intl-format-cache',
    'intl-messageformat',
    'intl-relativeformat',
    'invariant',
    'react',
    'prop-types',
    p.resolve('locale-data/index.js'),
  ],
  plugins: [babel()],
};
