import {
  convertNumberSkeletonToNumberFormatOptions,
  isArgumentElement,
  isDateElement,
  isDateTimeSkeleton,
  isLiteralElement,
  isNumberElement,
  isNumberSkeleton,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTimeElement,
  MessageFormatElement,
  parseDateTimeSkeleton,
} from 'intl-messageformat-parser';

export interface Formats {
  number: Record<string, Intl.NumberFormatOptions>;
  date: Record<string, Intl.DateTimeFormatOptions>;
  time: Record<string, Intl.DateTimeFormatOptions>;
}

export interface FormatterCache {
  number: Record<string, Intl.NumberFormat>;
  dateTime: Record<string, Intl.DateTimeFormat>;
  pluralRules: Record<string, Intl.PluralRules>;
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

export const enum PART_TYPE {
  literal,
  argument,
}

export interface LiteralPart {
  type: PART_TYPE.literal;
  value: string;
}

export interface ArgumentPart {
  type: PART_TYPE.argument;
  value: any;
}

export type MessageFormatPart = LiteralPart | ArgumentPart;

export type PrimitiveType = string | number | boolean | null | undefined | Date;

class FormatError extends Error {
  public readonly variableId?: string;
  constructor(msg?: string, variableId?: string) {
    super(msg);
    this.variableId = variableId;
  }
}

function mergeLiteral(parts: MessageFormatPart[]): MessageFormatPart[] {
  if (parts.length < 2) {
    return parts;
  }
  return parts.reduce((all, part) => {
    const lastPart = all[all.length - 1];
    if (
      !lastPart ||
      lastPart.type !== PART_TYPE.literal ||
      part.type !== PART_TYPE.literal
    ) {
      all.push(part);
    } else {
      lastPart.value += part.value;
    }
    return all;
  }, [] as MessageFormatPart[]);
}

// TODO(skeleton): add skeleton support
export function formatToParts(
  els: MessageFormatElement[],
  locales: string | string[],
  formatters: Formatters,
  formats: Formats,
  values?: Record<string, any>,
  currentPluralValue?: number,
  // For debugging
  originalMessage?: string
): MessageFormatPart[] {
  // Hot path for straight simple msg translations
  if (els.length === 1 && isLiteralElement(els[0])) {
    return [
      {
        type: PART_TYPE.literal,
        value: els[0].value,
      },
    ];
  }
  const result: MessageFormatPart[] = [];
  for (const el of els) {
    // Exit early for string parts.
    if (isLiteralElement(el)) {
      result.push({
        type: PART_TYPE.literal,
        value: el.value,
      });
      continue;
    }
    // TODO: should this part be literal type?
    // Replace `#` in plural rules with the actual numeric value.
    if (isPoundElement(el)) {
      if (typeof currentPluralValue === 'number') {
        result.push({
          type: PART_TYPE.literal,
          value: formatters.getNumberFormat(locales).format(currentPluralValue),
        });
      }
      continue;
    }

    const {value: varName} = el;

    // Enforce that all required values are provided by the caller.
    if (!(values && varName in values)) {
      throw new FormatError(
        `The intl string context variable "${varName}" was not provided to the string "${originalMessage}"`
      );
    }

    let value = values[varName];
    if (isArgumentElement(el)) {
      if (!value || typeof value === 'string' || typeof value === 'number') {
        value =
          typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : '';
      }
      result.push({
        type: PART_TYPE.argument,
        value,
      });
      continue;
    }

    // Recursively format plural and select parts' option — which can be a
    // nested pattern structure. The choosing of the option to use is
    // abstracted-by and delegated-to the part helper object.
    if (isDateElement(el)) {
      const style =
        typeof el.style === 'string' ? formats.date[el.style] : undefined;
      result.push({
        type: PART_TYPE.literal,
        value: formatters
          .getDateTimeFormat(locales, style)
          .format(value as number),
      });
      continue;
    }
    if (isTimeElement(el)) {
      const style =
        typeof el.style === 'string'
          ? formats.time[el.style]
          : isDateTimeSkeleton(el.style)
          ? parseDateTimeSkeleton(el.style.pattern)
          : undefined;
      result.push({
        type: PART_TYPE.literal,
        value: formatters
          .getDateTimeFormat(locales, style)
          .format(value as number),
      });
      continue;
    }
    if (isNumberElement(el)) {
      const style =
        typeof el.style === 'string'
          ? formats.number[el.style]
          : isNumberSkeleton(el.style)
          ? convertNumberSkeletonToNumberFormatOptions(el.style.tokens)
          : undefined;
      result.push({
        type: PART_TYPE.literal,
        value: formatters
          .getNumberFormat(locales, style)
          .format(value as number),
      });
      continue;
    }
    if (isSelectElement(el)) {
      const opt = el.options[value as string] || el.options.other;
      if (!opt) {
        throw new RangeError(
          `Invalid values for "${
            el.value
          }": "${value}". Options are "${Object.keys(el.options).join('", "')}"`
        );
      }
      result.push(
        ...formatToParts(opt.value, locales, formatters, formats, values)
      );
      continue;
    }
    if (isPluralElement(el)) {
      let opt = el.options[`=${value}`];
      if (!opt) {
        if (!Intl.PluralRules) {
          throw new FormatError(`Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`);
        }
        const rule = formatters
          .getPluralRules(locales, {type: el.pluralType})
          .select((value as number) - (el.offset || 0));
        opt = el.options[rule] || el.options.other;
      }
      if (!opt) {
        throw new RangeError(
          `Invalid values for "${
            el.value
          }": "${value}". Options are "${Object.keys(el.options).join('", "')}"`
        );
      }
      result.push(
        ...formatToParts(
          opt.value,
          locales,
          formatters,
          formats,
          values,
          value - (el.offset || 0)
        )
      );
      continue;
    }
  }
  return mergeLiteral(result);
}

export function formatToString(
  els: MessageFormatElement[],
  locales: string | string[],
  formatters: Formatters,
  formats: Formats,
  values?: Record<string, PrimitiveType>,
  // For debugging
  originalMessage?: string
): string {
  const parts = formatToParts(
    els,
    locales,
    formatters,
    formats,
    values,
    undefined,
    originalMessage
  );
  // Hot path for straight simple msg translations
  if (parts.length === 1) {
    return parts[0].value;
  }
  return parts.reduce((all, part) => (all += part.value), '');
}

export type FormatXMLElementFn = (...args: any[]) => string | object;

// Singleton
let domParser: DOMParser;
const TOKEN_DELIMITER = '@@';
const TOKEN_REGEX = /@@(\d+_\d+)@@/g;
let counter = 0;
function generateId() {
  return `${Date.now()}_${++counter}`;
}

function restoreRichPlaceholderMessage(
  text: string,
  objectParts: Record<string, any>
): Array<string | object> {
  return text
    .split(TOKEN_REGEX)
    .filter(Boolean)
    .map(c => (objectParts[c] != null ? objectParts[c] : c))
    .reduce((all, c) => {
      if (!all.length) {
        all.push(c);
      } else if (
        typeof c === 'string' &&
        typeof all[all.length - 1] === 'string'
      ) {
        all[all.length - 1] += c;
      } else {
        all.push(c);
      }
      return all;
    }, []);
}

/**
 * Not exhaustive, just for sanity check
 */
const SIMPLE_XML_REGEX = /(<([0-9a-zA-Z-_]*?)>(.*?)<\/([0-9a-zA-Z-_]*?)>)|(<[0-9a-zA-Z-_]*?\/>)/;

const TEMPLATE_ID = Date.now() + '@@';

const VOID_ELEMENTS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

function formatHTMLElement(
  el: Element,
  objectParts: Record<string, any>,
  values: Record<string, PrimitiveType | object | FormatXMLElementFn>
): Array<PrimitiveType | object> {
  let {tagName} = el;
  const {outerHTML, textContent, childNodes} = el;
  // Regular text
  if (!tagName) {
    return restoreRichPlaceholderMessage(textContent || '', objectParts);
  }

  tagName = tagName.toLowerCase();
  const isVoidElement = ~VOID_ELEMENTS.indexOf(tagName);
  const formatFnOrValue = values[tagName];

  if (formatFnOrValue && isVoidElement) {
    throw new FormatError(
      `${tagName} is a self-closing tag and can not be used, please use another tag name.`
    );
  }

  if (!childNodes.length) {
    return [outerHTML];
  }

  const chunks: any[] = (Array.prototype.slice.call(
    childNodes
  ) as ChildNode[]).reduce(
    (all: any[], child) =>
      all.concat(formatHTMLElement(child as HTMLElement, objectParts, values)),
    []
  );

  // Legacy HTML
  if (!formatFnOrValue) {
    return [`<${tagName}>`, ...chunks, `</${tagName}>`];
  }
  // HTML Tag replacement
  if (typeof formatFnOrValue === 'function') {
    return [formatFnOrValue(...chunks)];
  }
  return [formatFnOrValue];
}

export function formatHTMLMessage(
  els: MessageFormatElement[],
  locales: string | string[],
  formatters: Formatters,
  formats: Formats,
  values?: Record<string, PrimitiveType | object | FormatXMLElementFn>,
  // For debugging
  originalMessage?: string
): Array<string | object> {
  const parts = formatToParts(
    els,
    locales,
    formatters,
    formats,
    values,
    undefined,
    originalMessage
  );
  const objectParts: Record<string, ArgumentPart['value']> = {};
  const formattedMessage = parts.reduce((all, part) => {
    if (part.type === PART_TYPE.literal) {
      return (all += part.value);
    }
    const id = generateId();
    objectParts[id] = part.value;
    return (all += `${TOKEN_DELIMITER}${id}${TOKEN_DELIMITER}`);
  }, '');

  // Not designed to filter out aggressively
  if (!SIMPLE_XML_REGEX.test(formattedMessage)) {
    return restoreRichPlaceholderMessage(formattedMessage, objectParts);
  }
  if (!values) {
    throw new FormatError('Message has placeholders but no values was given');
  }
  if (typeof DOMParser === 'undefined') {
    throw new FormatError('Cannot format XML message without DOMParser');
  }
  if (!domParser) {
    domParser = new DOMParser();
  }

  const content = domParser
    .parseFromString(
      `<formatted-message id="${TEMPLATE_ID}">${formattedMessage}</formatted-message>`,
      'text/html'
    )
    .getElementById(TEMPLATE_ID);

  if (!content) {
    throw new FormatError(`Malformed HTML message ${formattedMessage}`);
  }
  const tagsToFormat = Object.keys(values).filter(
    varName => !!content.getElementsByTagName(varName).length
  );

  // No tags to format
  if (!tagsToFormat.length) {
    return restoreRichPlaceholderMessage(formattedMessage, objectParts);
  }

  const caseSensitiveTags = tagsToFormat.filter(
    tagName => tagName !== tagName.toLowerCase()
  );
  if (caseSensitiveTags.length) {
    throw new FormatError(
      `HTML tag must be lowercased but the following tags are not: ${caseSensitiveTags.join(
        ', '
      )}`
    );
  }

  // We're doing this since top node is `<formatted-message/>` which does not have a formatter
  return Array.prototype.slice
    .call(content.childNodes)
    .reduce(
      (all, child) => all.concat(formatHTMLElement(child, objectParts, values)),
      []
    );
}
