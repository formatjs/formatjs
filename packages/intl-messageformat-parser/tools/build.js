#!/usr/bin/env node
const peg = require('pegjs');
const tspegjs = require('ts-pegjs');
const fs = require('fs');
const {outputFileSync} = require('fs-extra');
const minimist = require('minimist');

function main({out, input}) {
  // TS
  const srcString = peg.generate(fs.readFileSync(input, 'utf-8'), {
    plugins: [tspegjs],
    output: 'source',
    tspegjs: {
      customHeader: `
import {
    ArgumentElement,
    DateElement,
    DateTimeSkeleton,
    LiteralElement,
    MessageFormatElement,
    NumberElement,
    NumberSkeleton,
    PluralElement,
    PluralOrSelectOption,
    PoundElement,
    SelectElement,
    SKELETON_TYPE,
    TagElement,
    TimeElement,
    TYPE,
} from './types'`,
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
      tagElement: 'TagElement',
      selectElement: 'SelectElement',
      pluralElement: 'PluralElement',
      poundElement: 'PoundElement',
      selectOption: 'PluralOrSelectOption',
      pluralOption: 'PluralOrSelectOption',
      numberSkeleton: 'NumberSkeleton',
      dateTimeSkeleton: 'DateTimeSkeleton',
      numberArgStyle: 'string | NumberSkeleton',
      dateTimeArgStyle: 'string | DateTimeSkeleton',
      simpleFormatElement: `
| NumberElement
| DateElement
| TimeElement
`,
    },
  });

  const REGEX = /ParseFunction = \((.*?)\) => (any);/g;
  const PARSE_EXPORT = /export const parse:/g;
  outputFileSync(
    out,
    '// @ts-nocheck\n' +
      srcString
        .replace(REGEX, 'ParseFunction = ($1) => MessageFormatElement[];')
        .replace(PARSE_EXPORT, 'export const pegParse:')
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
