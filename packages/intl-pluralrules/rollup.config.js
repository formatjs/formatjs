module.exports = 
  {
    input: './index.js',
    output: {
      sourcemap: true,
      file: 'intl-pluralrules.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlPluralRules',
    },
  }