/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as React from 'react';
import IntlMessageFormat, {
  Formats,
  PrimitiveType,
  FormatXMLElementFn,
} from 'intl-messageformat';
import IntlRelativeTimeFormat, {
  IntlRelativeTimeFormatOptions,
} from '@formatjs/intl-relativetimeformat';
import {MessageFormatElement} from 'intl-messageformat-parser';

export interface IntlConfig {
  locale: string;
  timeZone?: string;
  formats: CustomFormats;
  textComponent?: React.ComponentType | keyof React.ReactHTML;
  messages: Record<string, string> | Record<string, MessageFormatElement[]>;
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
  formatDate(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): string;
  formatTime(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): string;
  formatRelativeTime(
    value: Parameters<IntlRelativeTimeFormat['format']>[0],
    unit?: Parameters<IntlRelativeTimeFormat['format']>[1],
    opts?: FormatRelativeTimeOptions
  ): string;
  formatNumber(
    value: Parameters<Intl.NumberFormat['format']>[0],
    opts?: FormatNumberOptions
  ): string;
  formatPlural(
    value: Parameters<Intl.PluralRules['select']>[0],
    opts?: FormatPluralOptions
  ): ReturnType<Intl.PluralRules['select']>;
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType>
  ): string;
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<
      string,
      PrimitiveType | React.ReactElement | FormatXMLElementFn
    >
  ): string | React.ReactNodeArray;
  formatHTMLMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType>
  ): string;
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
}

export interface IntlShape extends IntlConfig, IntlFormatters {
  formatters: Formatters;
}

export interface IntlCache {
  dateTime: Record<string, Intl.DateTimeFormat>;
  number: Record<string, Intl.NumberFormat>;
  message: Record<string, IntlMessageFormat>;
  relativeTime: Record<string, IntlRelativeTimeFormat>;
  pluralRules: Record<string, Intl.PluralRules>;
}

export interface MessageDescriptor {
  id: string;
  description?: string | object;
  defaultMessage?: string;
}

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
