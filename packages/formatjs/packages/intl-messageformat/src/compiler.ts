/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

import {
  MessageFormatPattern,
  MessageTextElement,
  ArgumentElement,
  PluralFormat as ParserPluralFormat,
  SelectFormat as ParserSelectFormat
} from 'intl-messageformat-parser';

export interface Formats {
  number: Record<string, Intl.NumberFormatOptions>;
  date: Record<string, Intl.DateTimeFormatOptions>;
  time: Record<string, Intl.DateTimeFormatOptions>;
}

export interface Formatters {
  getNumberFormat(
    ...args: ConstructorParameters<typeof Intl.NumberFormat>
  ): Intl.NumberFormat;
  getDateTimeFormat(
    ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
  ): Intl.DateTimeFormat;
  getPluralRules(
    ...args: ConstructorParameters<typeof Intl.PluralRules>
  ): Intl.PluralRules;
}

export type Pattern =
  | string
  | PluralOffsetString
  | PluralFormat
  | SelectFormat
  | StringFormat;

export default class Compiler {
  private locales: string | string[] = [];
  private formats: Formats = {
    number: {},
    date: {},
    time: {}
  };
  private pluralNumberFormat: Intl.NumberFormat | null = null;
  private currentPlural: ArgumentElement | null | undefined = null;
  private pluralStack: Array<ArgumentElement | null | undefined> = [];
  private formatters: Formatters;

  constructor(
    locales: string | string[],
    formats: Formats,
    formatters: Formatters
  ) {
    this.locales = locales;
    this.formats = formats;
    this.formatters = formatters;
  }

  compile(ast: MessageFormatPattern): Pattern[] {
    this.pluralStack = [];
    this.currentPlural = null;
    this.pluralNumberFormat = null;

    return this.compileMessage(ast);
  }

  compileMessage(ast: MessageFormatPattern) {
    if (!(ast && ast.type === 'messageFormatPattern')) {
      throw new Error('Message AST is not of type: "messageFormatPattern"');
    }
    const { elements } = ast;
    const pattern = elements
      .filter<MessageTextElement | ArgumentElement>(
        (el): el is MessageTextElement | ArgumentElement =>
          el.type === 'messageTextElement' || el.type === 'argumentElement'
      )
      .map(el =>
        el.type === 'messageTextElement'
          ? this.compileMessageText(el)
          : this.compileArgument(el)
      );
    if (pattern.length !== elements.length) {
      throw new Error('Message element does not have a valid type');
    }

    return pattern;
  }

  compileMessageText(element: MessageTextElement) {
    // When this `element` is part of plural sub-pattern and its value contains
    // an unescaped '#', use a `PluralOffsetString` helper to properly output
    // the number with the correct offset in the string.
    if (this.currentPlural && /(^|[^\\])#/g.test(element.value)) {
      // Create a cache a NumberFormat instance that can be reused for any
      // PluralOffsetString instance in this message.
      if (!this.pluralNumberFormat) {
        this.pluralNumberFormat = new Intl.NumberFormat(this.locales);
      }

      return new PluralOffsetString(
        this.currentPlural.id,
        (this.currentPlural.format as ParserPluralFormat).offset,
        this.pluralNumberFormat,
        element.value
      );
    }

    // Unescape the escaped '#'s in the message text.
    return element.value.replace(/\\#/g, '#');
  }

  compileArgument(element: ArgumentElement) {
    const { format, id } = element;
    const { formatters } = this;

    if (!format) {
      return new StringFormat(id);
    }

    const { formats, locales } = this;
    switch (format.type) {
      case 'numberFormat':
        return {
          id,
          format: formatters.getNumberFormat(
            locales,
            formats.number[format.style]
          ).format
        };

      case 'dateFormat':
        return {
          id,
          format: formatters.getDateTimeFormat(
            locales,
            formats.date[format.style]
          ).format
        };

      case 'timeFormat':
        return {
          id,
          format: formatters.getDateTimeFormat(
            locales,
            formats.time[format.style]
          ).format
        };

      case 'pluralFormat':
        return new PluralFormat(
          id,
          format.offset,
          this.compileOptions(element),
          formatters.getPluralRules(locales, {
            type: format.ordinal ? 'ordinal' : 'cardinal'
          })
        );

      case 'selectFormat':
        return new SelectFormat(id, this.compileOptions(element));

      default:
        throw new Error('Message element does not have a valid format type');
    }
  }

  compileOptions(element: ArgumentElement) {
    const format = element.format as ParserPluralFormat | ParserSelectFormat;
    const { options } = format;

    // Save the current plural element, if any, then set it to a new value when
    // compiling the options sub-patterns. This conforms the spec's algorithm
    // for handling `"#"` syntax in message text.
    this.pluralStack.push(this.currentPlural);
    this.currentPlural = format.type === 'pluralFormat' ? element : null;
    const optionsHash = options.reduce(
      (all: Record<string, Array<Pattern>>, option) => {
        // Compile the sub-pattern and save it under the options's selector.
        all[option.selector] = this.compileMessage(option.value);
        return all;
      },
      {}
    );

    // Pop the plural stack to put back the original current plural value.
    this.currentPlural = this.pluralStack.pop();

    return optionsHash;
  }
}

// -- Compiler Helper Classes --------------------------------------------------

abstract class Formatter {
  public id: string;
  constructor(id: string) {
    this.id = id;
  }
  abstract format(value: string | number): string;
}

class StringFormat extends Formatter {
  format(value: number | string) {
    if (!value && typeof value !== 'number') {
      return '';
    }

    return typeof value === 'string' ? value : String(value);
  }
}

class PluralFormat {
  public id: string;
  private offset: number;
  private options: Record<string, Pattern[]>;
  private pluralRules: Intl.PluralRules;
  constructor(
    id: string,
    offset: number,
    options: Record<string, Pattern[]>,
    pluralRules: Intl.PluralRules
  ) {
    this.id = id;
    this.offset = offset;
    this.options = options;
    this.pluralRules = pluralRules;
  }

  getOption(value: number) {
    const { options } = this;

    const option =
      options['=' + value] ||
      options[this.pluralRules.select(value - this.offset)];

    return option || options.other;
  }
}

export class PluralOffsetString extends Formatter {
  private offset: number;
  private numberFormat: Intl.NumberFormat;
  private string: string;
  constructor(
    id: string,
    offset: number,
    numberFormat: Intl.NumberFormat,
    string: string
  ) {
    super(id);
    this.offset = offset;
    this.numberFormat = numberFormat;
    this.string = string;
  }

  format(value: number) {
    const number = this.numberFormat.format(value - this.offset);

    return this.string
      .replace(/(^|[^\\])#/g, '$1' + number)
      .replace(/\\#/g, '#');
  }
}

export class SelectFormat {
  public id: string;
  private options: Record<string, Pattern[]>;
  constructor(id: string, options: Record<string, Pattern[]>) {
    this.id = id;
    this.options = options;
  }

  getOption(value: string) {
    const { options } = this;
    return options[value] || options.other;
  }
}

export function isSelectOrPluralFormat(
  f: any
): f is SelectFormat | PluralFormat {
  return !!f.options;
}
