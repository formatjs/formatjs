import type {LocaleData} from '#packages/ecma402-abstract/types/core.js'
import type {
  DateTimeFormatLocaleInternalData,
  IntervalFormatsData,
} from '#packages/ecma402-abstract/types/date-time.js'

export interface PackedData {
  zones: string[]
  abbrvs: string
  offsets: string
}

export interface UnpackedData {
  zones: Record<string, ZoneData[]>
  abbrvs: string[]
  /**
   * Offset in seconds, base 36
   */
  offsets: number[]
}

export type ZoneData = [
  // Seconds from UTC Time, empty string if NULL
  number | string,
  // Index of abbreviation in abbrvs like EST/EDT
  number,
  // Index of offsets in seconds
  number,
  // Whether it's daylight, 0|1
  number,
]

export type RawDateTimeLocaleData = LocaleData<RawDateTimeLocaleInternalData>

export type RawDateTimeLocaleInternalData = Omit<
  DateTimeFormatLocaleInternalData,
  | 'dateFormat'
  | 'timeFormat'
  | 'dateTimeFormat'
  | 'formats'
  | 'intervalFormats'
  | 'calendarData'
> & {
  calendarData?: Record<
    string,
    Pick<
      RawDateTimeLocaleInternalData,
      | 'era'
      | 'month'
      | 'monthStandalone'
      | 'yearNames'
      | 'leapMonthPatterns'
      | 'dateFormat'
      | 'timeFormat'
      | 'dateTimeFormat'
      | 'intervalFormats'
    >
  >
  formats: Record<string, Record<string, string>>
  dateFormat: {full: string; long: string; medium: string; short: string}
  timeFormat: {full: string; long: string; medium: string; short: string}
  intervalFormats: IntervalFormatsData
  dateTimeFormat: {
    full: string
    long: string
    medium: string
    short: string
  }
}

export type TimeZoneNameData = Record<
  string,
  {
    long?: [string, string]
    short?: [string, string]
  }
>

/** Locale-specific names and patterns for one optional calendar. */
export interface RawCalendarLocaleData {
  locale: string
  calendar: string
  data: NonNullable<RawDateTimeLocaleInternalData['calendarData']>[string]
  formats: Record<string, string>
}
