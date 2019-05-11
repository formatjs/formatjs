#!/usr/bin/env node
const peg = require('pegjs')
const fs = require('fs')
const {outputFileSync} = require('fs-extra')
const grammar = fs.readFileSync('./src/parser.pegjs', 'utf-8')

// ES6
outputFileSync('src/parser.js', `export default ${peg.generate(grammar, {output: 'source'})}`)

// Globals
outputFileSync('dist/parser.js', peg.generate(grammar, {output: 'source', format: 'globals', exportVar: 'IntlMessageFormatParser'}))

// CJS
outputFileSync('lib/parser.js', peg.generate(grammar, {output: 'source', format: 'commonjs'}))