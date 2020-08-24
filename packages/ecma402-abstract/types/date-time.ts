export interface DateTimeFormatOptions extends Intl.DateTimeFormatOptions {
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24';
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  fractionalSecondDigits?: number;
  calendar?:
    | 'buddhist'
    | 'chinese'
    | 'coptic'
    | 'ethiopia'
    | 'ethiopic'
    | 'gregory'
    | 'hebrew'
    | 'indian'
    | 'islamic'
    | 'iso8601'
    | 'japanese'
    | 'persian'
    | 'roc';
  // dayPeriod?: 'narrow' | 'short' | 'long';
  numberingSystem?: string;
}

export type Formats = Pick<
  DateTimeFormatOptions,
  | 'weekday'
  | 'era'
  | 'year'
  | 'month'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'timeZoneName'
> & {
  hour12?: boolean;
  pattern: string;
  pattern12: string;
  skeleton: string;
  rawPattern: string;
};

export interface IntlDateTimeFormatInternal {
  locale: string;
  dataLocale: string;
  calendar?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  weekday: 'narrow' | 'short' | 'long';
  era: 'narrow' | 'short' | 'long';
  year: '2-digit' | 'numeric';
  month: '2-digit' | 'numeric' | 'narrow' | 'short' | 'long';
  day: '2-digit' | 'numeric';
  hour: '2-digit' | 'numeric';
  minute: '2-digit' | 'numeric';
  second: '2-digit' | 'numeric';
  timeZoneName: 'short' | 'long';
  hourCycle: string;
  numberingSystem: string;
  timeZone: string;
  pattern: string;
  boundFormat?: Intl.DateTimeFormat['format'];
}

export type TABLE_6 =
  | 'weekday'
  | 'era'
  | 'year'
  | 'month'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'timeZoneName';

export type TimeZoneNameData = Record<
  string,
  {
    long?: [string, string];
    short?: [string, string];
  }
>;

export interface EraData {
  BC: string;
  AD: string;
}

export interface DateTimeFormatLocaleInternalData {
  am: string;
  pm: string;
  weekday: {
    narrow: string[];
    long: string[];
    short: string[];
  };
  era: {
    narrow: EraData;
    long: EraData;
    short: EraData;
  };
  month: {
    narrow: string[];
    long: string[];
    short: string[];
  };
  timeZoneName: TimeZoneNameData;
  /**
   * So we can construct GMT+08:00
   */
  gmtFormat: string;
  /**
   * So we can construct GMT+08:00
   */
  hourFormat: string;
  hourCycle: string;
  dateFormat: {full: Formats; long: Formats; medium: Formats; short: Formats};
  timeFormat: {full: Formats; long: Formats; medium: Formats; short: Formats};
  dateTimeFormat: {full: string; long: string; medium: string; short: string};
  formats: Record<string, Formats[]>;
  nu: string[];
  hc: string[];
  ca: string[];
}

export interface DateTimeFormat extends Intl.DateTimeFormat {
  resolvedOptions(): ResolvedDateTimeFormatOptions;
}

export interface ResolvedDateTimeFormatOptions
  extends Intl.ResolvedDateTimeFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  hourCycle: string;
  numberingSystem: string;
}

export type UnpackedZoneData = [
  // Seconds from UTC Time, -Infinity if NULL
  number,
  // abbrvs like EST/EDT
  string,
  // offsets in seconds
  number,
  // Whether it's daylight, 0|1
  boolean
];
