#!/usr/bin/env node
const peg = require('pegjs');
const tspegjs = require('ts-pegjs');
const fs = require('fs');
const { outputFileSync } = require('fs-extra');
const grammar = fs.readFileSync('./src/parser.pegjs', 'utf-8');

// TS
const srcString = peg.generate(grammar, {
  plugins: [tspegjs],
  output: 'source',
  tspegjs: {
    customHeader: `
import {
    MessageFormatElement,
    LiteralElement,
    ArgumentElement,
    NumberElement,
    DateElement,
    TimeElement,
    SelectElement,
    PluralElement,
    PluralOrSelectOption,
    NumberSkeleton,
    DateSkeleton,
    SKELETON_TYPE,
    TYPE,
} from './types'`
  },
  returnTypes: {
    argument: 'string',
    ws: 'string',
    digit: 'string',
    hexDigit: 'string',
    quoteEscapedChar: 'string',
    apostrophe: 'string',
    escape: 'string',
    char: 'string',
    chars: 'string',
    varName: 'string',
    number: 'number',
    start: 'MessageFormatElement[]',
    message: 'MessageFormatElement[]',
    literalElement: 'LiteralElement',
    argumentElement: 'ArgumentElement',
    selectElement: 'SelectElement',
    pluralElement: 'PluralElement',
    selectOption: 'PluralOrSelectOption',
    pluralOption: 'PluralOrSelectOption',
    numberSkeleton: 'NumberSkeleton',
    dateOrTimeSkeleton: 'DateSkeleton',
    numberArgStyle: 'string | NumberSkeleton',
    dateOrTimeArgStyle: 'string | DateSkeleton',
    simpleFormatElement: `
| NumberElement
| DateElement
| TimeElement
`
  }
});

const REGEX = /ParseFunction = \((.*?)\) => (any);/g;

outputFileSync(
  'src/parser.ts',
  srcString.replace(REGEX, 'ParseFunction = ($1) => MessageFormatElement[];')
);
