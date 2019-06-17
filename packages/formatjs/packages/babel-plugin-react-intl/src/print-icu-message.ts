/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import parser, {
  MessageFormatPattern,
  ElementFormat,
  MessageTextElement,
  SimpleFormat,
  ArgumentElement,
  PluralFormat
} from 'intl-messageformat-parser';

const ESCAPED_CHARS: Record<string, string> = {
  '\\': '\\\\',
  '\\#': '\\#',
  '{': '\\{',
  '}': '\\}'
};

const ESAPE_CHARS_REGEXP = /\\#|[{}\\]/g;

export default function printICUMessage(message: string) {
  let ast = parser.parse(message);
  return _printICUMessage(ast);
}

function isPluralFormat(format: ElementFormat): format is PluralFormat {
  return format.type === 'pluralFormat';
}

function isSimpleFormat(format: ElementFormat): format is SimpleFormat {
  return (
    format.type === 'numberFormat' ||
    format.type === 'dateFormat' ||
    format.type === 'timeFormat'
  );
}

function _printICUMessage(ast: MessageFormatPattern): string {
  let printedNodes = ast.elements.map(node => {
    if (node.type === 'messageTextElement') {
      return printMessageTextASTNode(node);
    }

    if (!node.format) {
      return `{${node.id}}`;
    }

    switch (getArgumentType(node.format)) {
      case 'number':
      case 'date':
      case 'time':
        return printSimpleFormatASTNode(node);

      case 'plural':
      case 'selectordinal':
      case 'select':
        return printOptionalFormatASTNode(node);
    }
  });

  return printedNodes.join('');
}

function getArgumentType(format: ElementFormat): string {
  const { type } = format;

  // Special-case ordinal plurals to use `selectordinal` instead of `plural`.
  if (isPluralFormat(format) && format.ordinal) {
    return 'selectordinal';
  }

  return type.replace(/Format$/, '').toLowerCase();
}

function printMessageTextASTNode({ value }: MessageTextElement) {
  return value.replace(ESAPE_CHARS_REGEXP, char => ESCAPED_CHARS[char]);
}

function printSimpleFormatASTNode({ id, format }: ArgumentElement) {
  let argumentType = getArgumentType(format);
  let style = isSimpleFormat(format) && format.style ? `, ${format.style}` : '';

  return `{${id}, ${argumentType}${style}}`;
}

function printOptionalFormatASTNode({ id, format }: ArgumentElement) {
  let argumentType = getArgumentType(format);
  let offset = (format as PluralFormat).offset
    ? `, offset:${(format as PluralFormat).offset}`
    : '';

  let options = (format as PluralFormat).options.map(option => {
    let optionValue = _printICUMessage(option.value);
    return ` ${option.selector} {${optionValue}}`;
  });

  return `{${id}, ${argumentType}${offset},${options.join('')}}`;
}
