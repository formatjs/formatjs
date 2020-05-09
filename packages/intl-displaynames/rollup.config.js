module.exports = 
  {
    input: './index.js',
    output: {
      sourcemap: true,
      file: 'intl-displaynames.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlDisplayNames',
    },
  }