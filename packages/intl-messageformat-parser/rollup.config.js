module.exports = 
  {
    input: './index.js',
    output: {
      sourcemap: true,
      file: 'intl-messageformat-parser.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlMessageFormatParser',
    },
  }