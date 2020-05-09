import * as peg from 'pegjs';
import * as tspegjs from 'ts-pegjs';
import * as fs from 'fs';
import {outputFileSync} from 'fs-extra';
import * as minimist from 'minimist';

function main(args: Record<string, string>) {
  const grammar = fs.readFileSync(args.in, 'utf-8');

  const srcString = peg.generate(grammar, {
    plugins: [tspegjs],
    output: 'source',
    format: 'commonjs',
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
  } as peg.OutputFormatAmdCommonjs);

  const REGEX = /ParseFunction = \((.*?)\) => (any);/g;
  const PARSE_EXPORT = /export const parse:/g;
  outputFileSync(
    args.out,
    '// @ts-nocheck\n' +
      srcString
        .replace(REGEX, 'ParseFunction = ($1) => MessageFormatElement[];')
        .replace(PARSE_EXPORT, 'export const pegParse:')
  );
}

if (require.main === module) {
  main(minimist(process.argv));
}
