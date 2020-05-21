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
  isTagElement,
} from 'intl-messageformat-parser';
import {
  MissingValueError,
  InvalidValueError,
  ErrorCode,
  FormatError,
  InvalidValueTypeError,
} from './error';

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
  object,
}

export interface LiteralPart {
  type: PART_TYPE.literal;
  value: string;
}

export interface ObjectPart<T = any> {
  type: PART_TYPE.object;
  value: T;
}

export type MessageFormatPart<T> = LiteralPart | ObjectPart<T>;

export type PrimitiveType = string | number | boolean | null | undefined | Date;

function mergeLiteral<T>(
  parts: MessageFormatPart<T>[]
): MessageFormatPart<T>[] {
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
  }, [] as MessageFormatPart<T>[]);
}

function isFormatXMLElementFn<T>(
  el: PrimitiveType | T | FormatXMLElementFn<T>
): el is FormatXMLElementFn<T> {
  return typeof el === 'function';
}

// TODO(skeleton): add skeleton support
export function formatToParts<T>(
  els: MessageFormatElement[],
  locales: string | string[],
  formatters: Formatters,
  formats: Formats,
  values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T>>,
  currentPluralValue?: number,
  // For debugging
  originalMessage?: string
): MessageFormatPart<T>[] {
  // Hot path for straight simple msg translations
  if (els.length === 1 && isLiteralElement(els[0])) {
    return [
      {
        type: PART_TYPE.literal,
        value: els[0].value,
      },
    ];
  }
  const result: MessageFormatPart<T>[] = [];
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
      throw new MissingValueError(varName, originalMessage);
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
        type: typeof value === 'string' ? PART_TYPE.literal : PART_TYPE.object,
        value,
      } as ObjectPart<T>);
      continue;
    }

    // Recursively format plural and select parts' option — which can be a
    // nested pattern structure. The choosing of the option to use is
    // abstracted-by and delegated-to the part helper object.
    if (isDateElement(el)) {
      const style =
        typeof el.style === 'string'
          ? formats.date[el.style]
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
    if (isTagElement(el)) {
      const {children, value} = el;
      const formatFn = values[value];
      if (!isFormatXMLElementFn<T>(formatFn)) {
        throw new InvalidValueTypeError(value, 'function', originalMessage);
      }
      const parts = formatToParts<T>(
        children,
        locales,
        formatters,
        formats,
        values,
        currentPluralValue
      );
      let chunks = formatFn(...parts.map(p => p.value));
      if (!Array.isArray(chunks)) {
        chunks = [chunks];
      }
      result.push(
        ...chunks.map(
          (c): MessageFormatPart<T> => {
            return {
              type:
                typeof c === 'string' ? PART_TYPE.literal : PART_TYPE.object,
              value: c,
            } as MessageFormatPart<T>;
          }
        )
      );
    }
    if (isSelectElement(el)) {
      const opt = el.options[value as string] || el.options.other;
      if (!opt) {
        throw new InvalidValueError(
          el.value,
          value,
          Object.keys(el.options),
          originalMessage
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
          throw new FormatError(
            `Intl.PluralRules is not available in this environment.
Try polyfilling it using "@formatjs/intl-pluralrules"
`,
            ErrorCode.MISSING_INTL_API,
            originalMessage
          );
        }
        const rule = formatters
          .getPluralRules(locales, {type: el.pluralType})
          .select((value as number) - (el.offset || 0));
        opt = el.options[rule] || el.options.other;
      }
      if (!opt) {
        throw new InvalidValueError(
          el.value,
          value,
          Object.keys(el.options),
          originalMessage
        );
      }
      result.push(
        ...formatToParts(
          opt.value,
          locales,
          formatters,
          formats,
          values,
          (value as number) - (el.offset || 0)
        )
      );
      continue;
    }
  }
  return mergeLiteral(result);
}

export type FormatXMLElementFn<T, R = string | Array<string | T>> = (
  ...args: Array<string | T>
) => R;
