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

  constructor(locales: string | string[], formats: Formats) {
    this.locales = locales;
    this.formats = formats;
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

    if (!format) {
      return new StringFormat(id);
    }

    const { formats, locales } = this;
    switch (format.type) {
      case 'numberFormat':
        return {
          id,
          format: new Intl.NumberFormat(locales, formats.number[format.style])
            .format
        };

      case 'dateFormat':
        return {
          id,
          format: new Intl.DateTimeFormat(locales, formats.date[format.style])
            .format
        };

      case 'timeFormat':
        return {
          id,
          format: new Intl.DateTimeFormat(locales, formats.time[format.style])
            .format
        };

      case 'pluralFormat':
        return new PluralFormat(
          id,
          format.ordinal,
          format.offset,
          this.compileOptions(element),
          locales
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
    const optionsHash: Record<string, Array<Pattern>> = {};

    // Save the current plural element, if any, then set it to a new value when
    // compiling the options sub-patterns. This conforms the spec's algorithm
    // for handling `"#"` syntax in message text.
    this.pluralStack.push(this.currentPlural);
    this.currentPlural = format.type === 'pluralFormat' ? element : null;

    var i, len, option;

    for (i = 0, len = options.length; i < len; i += 1) {
      option = options[i];

      // Compile the sub-pattern and save it under the options's selector.
      optionsHash[option.selector] = this.compileMessage(option.value);
    }

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

export class StringFormat extends Formatter {
  format(value: number | string) {
    if (!value && typeof value !== 'number') {
      return '';
    }

    return typeof value === 'string' ? value : String(value);
  }
}

export class PluralFormat {
  public id: string;
  private offset: number;
  private options: Record<string, Pattern[]>;
  private pluralRules: Intl.PluralRules;
  constructor(
    id: string,
    useOrdinal: boolean,
    offset: number,
    options: Record<string, Pattern[]>,
    locales: string | string[]
  ) {
    this.id = id;
    this.offset = offset;
    this.options = options;
    this.pluralRules = new Intl.PluralRules(locales, {
      type: useOrdinal ? 'ordinal' : 'cardinal'
    });
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
    var number = this.numberFormat.format(value - this.offset);

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
    var options = this.options;
    return options[value] || options.other;
  }
}

export function isSelectOrPluralFormat(
  f: any
): f is SelectFormat | PluralFormat {
  return !!f.options;
}
