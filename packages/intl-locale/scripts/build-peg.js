#!/usr/bin/env node
const peg = require('pegjs');
const tspegjs = require('ts-pegjs');
const fs = require('fs');
const {resolve} = require('path')
const { outputFileSync } = require('fs-extra');
const grammar = fs.readFileSync(resolve(__dirname, '../src/unicode-locale-id.pegjs'), 'utf-8');

// TS
const srcString = peg.generate(grammar, {
  plugins: [tspegjs],
  output: 'source',
  tspegjs: {
    customHeader: `
import {
  UnicodeLocaleId,
  UnicodeLanguageId,
  UnicodeExtension,
  TransformedExtension,
  OtherExtensions,
  PuExtension
} from './unicode-locale-id-types'`
  },
  returnTypes: {
    unicode_locale_id: 'UnicodeLocaleId',
    unicode_language_id: 'UnicodeLanguageId',
    tlang: 'UnicodeLanguageId',
    unicode_locale_extensions: 'UnicodeExtension',
    transformed_extensions: 'TransformedExtension',
    other_extensions: 'OtherExtensions',
    pu_extensions: 'PuExtension',
    sep: 'string',
    anum: 'string',
    digit: 'string',
    alpha: 'string'
  }
});

const REGEX = /ParseFunction = \((.*?)\) => (any);/g;
const PARSE_EXPORT = /export const parse:/g;
outputFileSync(
  resolve(__dirname, '../src/unicode-locale-id.ts'),
  '// @ts-nocheck\n' +
  srcString
    .replace(REGEX, 'ParseFunction = ($1) => UnicodeLocaleId;')
    .replace(PARSE_EXPORT, 'export const pegParse:')
);
