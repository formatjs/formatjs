/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {
  MessageFormatElement,
  isLiteralElement,
  LiteralElement,
  ArgumentElement,
  DateElement,
  TimeElement,
  NumberElement,
  SelectElement,
  PluralElement,
  isSelectElement,
  isArgumentElement,
  isDateElement,
  isTimeElement,
  isNumberElement,
  isPluralElement,
  TYPE,
  Skeleton,
  SKELETON_TYPE,
  NumberSkeletonToken,
  DateTimeSkeleton,
} from './types';

export function printAST(ast: MessageFormatElement[]): string {
  let printedNodes = ast.map(el => {
    if (isLiteralElement(el)) {
      return printLiteralElement(el);
    }

    if (isArgumentElement(el)) {
      return printArgumentElement(el);
    }
    if (isDateElement(el) || isTimeElement(el) || isNumberElement(el)) {
      return printSimpleFormatElement(el);
    }

    if (isPluralElement(el)) {
      return printPluralElement(el);
    }

    if (isSelectElement(el)) {
      return printSelectElement(el);
    }
  });

  return printedNodes.join('');
}

function printEscapedMessage(message: string): string {
  return message.replace(/([{}](?:.*[{}])?)/su, `'$1'`);
}

function printLiteralElement({value}: LiteralElement) {
  return printEscapedMessage(value);
}

function printArgumentElement({value}: ArgumentElement) {
  return `{${value}}`;
}

function printSimpleFormatElement(
  el: DateElement | TimeElement | NumberElement
) {
  return `{${el.value}, ${TYPE[el.type]}${
    el.style ? `, ${printArgumentStyle(el.style)}` : ''
  }}`;
}

function printNumberSkeletonToken(token: NumberSkeletonToken): string {
  const {stem, options} = token;
  return options.length === 0
    ? stem
    : `${stem}${options.map(o => `/${o}`).join('')}`;
}

function printArgumentStyle(style: string | Skeleton) {
  if (typeof style === 'string') {
    return printEscapedMessage(style);
  } else if (style.type === SKELETON_TYPE.dateTime) {
    return `::${printDateTimeSkeleton(style)}`;
  } else {
    return `::${style.tokens.map(printNumberSkeletonToken).join(' ')}`;
  }
}

export function printDateTimeSkeleton(style: DateTimeSkeleton): string {
  return style.pattern;
}

function printSelectElement(el: SelectElement) {
  const msg = [
    el.value,
    'select',
    Object.keys(el.options)
      .map(id => `${id}{${printAST(el.options[id].value)}}`)
      .join(' '),
  ].join(',');
  return `{${msg}}`;
}

function printPluralElement(el: PluralElement) {
  const type = el.pluralType === 'cardinal' ? 'plural' : 'selectordinal';
  const msg = [
    el.value,
    type,
    [
      el.offset ? `offset:${el.offset}` : '',
      ...Object.keys(el.options).map(
        id => `${id}{${printAST(el.options[id].value)}}`
      ),
    ]
      .filter(Boolean)
      .join(' '),
  ].join(',');
  return `{${msg}}`;
}
