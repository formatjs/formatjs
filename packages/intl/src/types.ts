import {
  IntlMessageFormat,
  Formats,
  PrimitiveType,
  FormatXMLElementFn,
  FormatError,
} from 'intl-messageformat';
import IntlRelativeTimeFormat, {
  IntlRelativeTimeFormatOptions,
} from '@formatjs/intl-relativetimeformat';
import {MessageFormatElement} from 'intl-messageformat-parser';
import {NumberFormatOptions} from '@formatjs/intl-numberformat';
import IntlListFormat, {IntlListFormatOptions} from '@formatjs/intl-listformat';
import {DisplayNames, DisplayNamesOptions} from '@formatjs/intl-displaynames';
import {DateTimeFormatOptions} from '@formatjs/intl-datetimeformat';
import {
  MissingTranslationError,
  MessageFormatError,
  MissingDataError,
  InvalidConfigError,
  UnsupportedFormatterError,
} from './error';
import {DEFAULT_INTL_CONFIG} from './utils';

export type OnErrorFn = (
  err:
    | MissingTranslationError
    | MessageFormatError
    | MissingDataError
    | InvalidConfigError
    | UnsupportedFormatterError
    | FormatError
) => void;

/**
 * Config for intl object.
 * Generic type T is the type of potential rich text element. For example:
 * With React, T would be React.ReactNode
 */
export interface IntlConfig<T = string> {
  locale: string;
  timeZone?: string;
  formats: CustomFormats;
  messages: Record<string, string> | Record<string, MessageFormatElement[]>;
  defaultLocale: string;
  defaultFormats: CustomFormats;
  defaultRichTextElements?: Record<string, FormatXMLElementFn<T>>;
  onError: OnErrorFn;
}

export interface CustomFormats extends Partial<Formats> {
  relative?: Record<string, IntlRelativeTimeFormatOptions>;
}

export interface CustomFormatConfig {
  format?: string;
}

export type FormatDateOptions = Exclude<
  DateTimeFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig;
export type FormatNumberOptions = Exclude<
  NumberFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig;
export type FormatRelativeTimeOptions = Exclude<
  IntlRelativeTimeFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig;
export type FormatPluralOptions = Exclude<
  Intl.PluralRulesOptions,
  'localeMatcher'
> &
  CustomFormatConfig;

export type FormatListOptions = Exclude<IntlListFormatOptions, 'localeMatcher'>;

export type FormatDisplayNameOptions = Exclude<
  DisplayNamesOptions,
  'localeMatcher'
>;

export interface IntlFormatters<T = any, R = T> {
  formatDate(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): string;
  formatTime(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): string;
  formatDateToParts(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): Intl.DateTimeFormatPart[];
  formatTimeToParts(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): Intl.DateTimeFormatPart[];
  formatRelativeTime(
    value: Parameters<IntlRelativeTimeFormat['format']>[0],
    unit?: Parameters<IntlRelativeTimeFormat['format']>[1],
    opts?: FormatRelativeTimeOptions
  ): string;
  formatNumber(
    value: Parameters<Intl.NumberFormat['format']>[0],
    opts?: FormatNumberOptions
  ): string;
  formatNumberToParts(
    value: Parameters<Intl.NumberFormat['format']>[0],
    opts?: FormatNumberOptions
  ): Intl.NumberFormatPart[];
  formatPlural(
    value: Parameters<Intl.PluralRules['select']>[0],
    opts?: FormatPluralOptions
  ): ReturnType<Intl.PluralRules['select']>;
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>
  ): string;
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T, R>>
  ): R;
  formatList(values: Array<string>, opts?: FormatListOptions): string;
  formatList(
    values: Array<string | T>,
    opts?: FormatListOptions
  ): T | string | Array<string | T>;
  formatDisplayName(
    value: Parameters<DisplayNames['of']>[0],
    opts?: FormatDisplayNameOptions
  ): string | undefined;
}

export interface Formatters {
  getDateTimeFormat(
    ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
  ): Intl.DateTimeFormat;
  getNumberFormat(
    ...args: ConstructorParameters<typeof Intl.NumberFormat>
  ): Intl.NumberFormat;
  getMessageFormat(
    ...args: ConstructorParameters<typeof IntlMessageFormat>
  ): IntlMessageFormat;
  getRelativeTimeFormat(
    ...args: ConstructorParameters<typeof IntlRelativeTimeFormat>
  ): IntlRelativeTimeFormat;
  getPluralRules(
    ...args: ConstructorParameters<typeof Intl.PluralRules>
  ): Intl.PluralRules;
  getListFormat(
    ...args: ConstructorParameters<typeof IntlListFormat>
  ): IntlListFormat;
  getDisplayNames(
    ...args: ConstructorParameters<typeof DisplayNames>
  ): DisplayNames;
}

export interface IntlShape<T> extends IntlConfig<T>, IntlFormatters {
  formatters: Formatters;
}

export interface IntlCache {
  dateTime: Record<string, Intl.DateTimeFormat>;
  number: Record<string, Intl.NumberFormat>;
  message: Record<string, IntlMessageFormat>;
  relativeTime: Record<string, IntlRelativeTimeFormat>;
  pluralRules: Record<string, Intl.PluralRules>;
  list: Record<string, IntlListFormat>;
  displayNames: Record<string, DisplayNames>;
}

export interface MessageDescriptor {
  id?: string | number;
  description?: string | object;
  defaultMessage?: string | MessageFormatElement[];
}

export type OptionalIntlConfig<T = string> = Omit<
  IntlConfig<T>,
  keyof typeof DEFAULT_INTL_CONFIG
> &
  Partial<typeof DEFAULT_INTL_CONFIG>;
