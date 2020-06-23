import {LocaleData} from '@formatjs/intl-utils';

export interface PackedData {
  zones: string[];
  abbrvs: string;
  offsets: string;
}

export interface UnpackedData {
  zones: Record<string, ZoneData[]>;
  abbrvs: string[];
  /**
   * Offset in seconds, base 36
   */
  offsets: number[];
}

export type ZoneData = [
  // Seconds from UTC Time, empty string if NULL
  number | string,
  // Index of abbreviation in abbrvs like EST/EDT
  number,
  // Index of offsets in seconds
  number,
  // Whether it's daylight, 0|1
  number
];

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

export type RawDateTimeLocaleData = LocaleData<RawDateTimeLocaleInternalData>;

export type RawDateTimeLocaleInternalData = Omit<
  DateTimeFormatLocaleInternalData,
  'formats'
> & {
  formats: Record<string, string[]>;
};

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
  formats: Record<string, Formats[]>;
  nu: string[];
  hc: string[];
  ca: string[];
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
};

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
