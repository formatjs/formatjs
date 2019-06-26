/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import {Formats} from 'intl-messageformat/lib/compiler';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeTimeFormat, {
  IntlRelativeTimeFormatOptions,
  FormattableUnit,
} from '@formatjs/intl-relativetimeformat';

export interface IntlConfig {
  locale: string;
  timeZone?: string;
  formats: CustomFormats;
  textComponent: React.ComponentType | keyof React.ReactHTML;
  messages: Record<string, string>;
  defaultLocale: string;
  defaultFormats: CustomFormats;
  onError(err: string): void;
}

export interface CustomFormats extends Partial<Formats> {
  relative?: Record<string, IntlRelativeTimeFormatOptions>;
}

export interface CustomFormatConfig {
  format?: string;
}

export type FormatDateOptions = Exclude<
  Intl.DateTimeFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig;
export type FormatNumberOptions = Exclude<
  Intl.NumberFormatOptions,
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

export interface IntlFormatters {
  formatDate(value: number | Date, opts: FormatDateOptions): string;
  formatTime(value: number | Date, opts: FormatDateOptions): string;
  formatRelativeTime(
    value: number,
    unit?: FormattableUnit,
    opts?: FormatRelativeTimeOptions
  ): string;
  formatNumber(value: number, opts: FormatNumberOptions): string;
  formatPlural(
    value: number,
    opts: FormatPluralOptions
  ): ReturnType<Intl.PluralRules['select']>;
  formatMessage(descriptor: MessageDescriptor, values: any): string;
  formatHTMLMessage: Function;
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
  ): typeof IntlMessageFormat;
  getRelativeTimeFormat(
    ...args: ConstructorParameters<typeof IntlRelativeTimeFormat>
  ): IntlRelativeTimeFormat;
  getPluralRules(
    ...args: ConstructorParameters<typeof Intl.PluralRules>
  ): Intl.PluralRules;
}

export interface IntlShape extends IntlConfig, IntlFormatters {
  formatters: Formatters;
}

export interface MessageDescriptor {
  id: string;
  description?: string | object;
  defaultMessage?: string;
}
