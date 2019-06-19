/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import {Formats} from 'intl-messageformat/lib/compiler';
import {IntlRelativeFormatOptions} from 'intl-relativeformat';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
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
  relative?: Record<string, IntlRelativeFormatOptions>;
  relativeTime?: Record<string, IntlRelativeTimeFormatOptions>;
}

export interface CustomFormatConfig {
  format?: string;
}

export type FormatDateOptions = Intl.DateTimeFormatOptions & CustomFormatConfig;
export type FormatNumberOptions = Intl.NumberFormatOptions & CustomFormatConfig;
export type FormatRelativeOptions = IntlRelativeFormatOptions &
  CustomFormatConfig & {now?: number};
export type FormatPluralOptions = Intl.PluralRulesOptions & CustomFormatConfig;
export type FormatRelativeTimeOptions = IntlRelativeTimeFormatOptions &
  CustomFormatConfig;

export interface IntlFormatters {
  formatDate(value: number | Date, opts: FormatDateOptions): string;
  formatTime(value: number | Date, opts: FormatDateOptions): string;
  formatRelative(value: number, opts: FormatRelativeOptions): string;
  formatRelativeTime(
    value: number,
    unit: FormattableUnit,
    opts: FormatRelativeTimeOptions
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
  getRelativeFormat(
    ...args: ConstructorParameters<typeof IntlRelativeFormat>
  ): typeof IntlRelativeFormat;
  getPluralRules(
    ...args: ConstructorParameters<typeof Intl.PluralRules>
  ): Intl.PluralRules;
  getRelativeTimeFormat(
    ...args: ConstructorParameters<typeof IntlRelativeTimeFormat>
  ): typeof IntlRelativeTimeFormat;
}

export interface IntlShape extends IntlConfig, IntlFormatters {
  formatters: Formatters;
  now(): number;
}

export interface MessageDescriptor {
  id: string;
  description?: string | object;
  defaultMessage?: string;
}
