import {LocaleData} from './core';
import {LDMLPluralRule} from './plural-rules';
import {LiteralPart} from '../utils';

export interface FieldData {
  '0'?: string;
  '1'?: string;
  '-1'?: string;
  '2'?: string;
  '-2'?: string;
  '3'?: string;
  '-3'?: string;
  future: RelativeTimeData;
  past: RelativeTimeData;
}

type RelativeTimeData = {[u in LDMLPluralRule]?: string};

export type UnpackedLocaleFieldsData = {
  [f in RelativeTimeField]?: FieldData;
} & {nu: Array<string | null>};

export type LocaleFieldsData = {
  [f in RelativeTimeField]?: FieldData;
} & {nu?: Array<string | null>};

export type RelativeTimeField =
  | 'second'
  | 'second-short'
  | 'second-narrow'
  | 'minute'
  | 'minute-short'
  | 'minute-narrow'
  | 'hour'
  | 'hour-short'
  | 'hour-narrow'
  | 'day'
  | 'day-short'
  | 'day-narrow'
  | 'week'
  | 'week-short'
  | 'week-narrow'
  | 'month'
  | 'month-short'
  | 'month-narrow'
  | 'quarter'
  | 'quarter-short'
  | 'quarter-narrow'
  | 'year'
  | 'year-short'
  | 'year-narrow';

export type RelativeTimeLocaleData = LocaleData<LocaleFieldsData>;

export type RelativeTimeUnit =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

export type RelativeTimeUnits =
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'quarters'
  | 'years';

export type RelativeTimeFormattableUnit = RelativeTimeUnit | RelativeTimeUnits;

export type RelativeTimePart = LiteralPart | RelativeTimeFormatNumberPart;

export interface RelativeTimeFormatNumberPart extends Intl.NumberFormatPart {
  unit: RelativeTimeUnit;
}

export interface IntlRelativeTimeFormatOptions {
  /**
   * The locale matching algorithm to use.
   * Possible values are "lookup" and "best fit"; the default is "best fit".
   * For information about this option, see
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_negotiation.
   */
  localeMatcher?: 'best fit' | 'lookup';
  /**
   * The format of output message. Possible values are:
   * - "always" (default, e.g., 1 day ago),
   * - or "auto" (e.g., yesterday).
   * The "auto" value allows to not always have to
   * use numeric values in the output.
   */
  numeric?: 'always' | 'auto';
  /**
   * The length of the internationalized message. Possible values are:
   * - "long" (default, e.g., in 1 month)
   * - "short" (e.g., in 1 mo.),
   * - or "narrow" (e.g., in 1 mo.).
   * The narrow style could be similar to the short style for some locales.
   */
  style?: 'long' | 'short' | 'narrow';
}

export interface ResolvedIntlRelativeTimeFormatOptions
  extends Pick<IntlRelativeTimeFormatOptions, 'style' | 'numeric'> {
  /**
   * The BCP 47 language tag for the locale actually used.
   * If any Unicode extension values were requested in the
   * input BCP 47 language tag that led to this locale,
   * the key-value pairs that were requested and are
   * supported for this locale are included in locale.
   */
  locale: string;
  /**
   * The value requested using the Unicode
   * extension key "nu" or filled in as a default.
   */
  numberingSystem: string;
}

export interface RelativeTimeFormat {
  format(value: number, unit: RelativeTimeFormattableUnit): string;

  formatToParts(
    value: number,
    unit: RelativeTimeFormattableUnit
  ): RelativeTimePart[];

  resolvedOptions(): ResolvedIntlRelativeTimeFormatOptions;
}

export interface RelativeTimeFormatInternal {
  numberFormat: Intl.NumberFormat;
  pluralRules: Intl.PluralRules;
  locale: string;
  fields: LocaleFieldsData;
  style: IntlRelativeTimeFormatOptions['style'];
  numeric: IntlRelativeTimeFormatOptions['numeric'];
  numberingSystem: string;
  initializedRelativeTimeFormat: boolean;
}
