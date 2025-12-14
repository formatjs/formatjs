// Public --------------------------------------------------------------------------------------------------------------

export type DurationFormatOptions = Partial<ResolvedDurationFormatOptions>

export interface ResolvedDurationFormatOptions {
  localeMatcher: 'best fit' | 'lookup'
  style: 'long' | 'short' | 'narrow' | 'digital'
  years: 'long' | 'short' | 'narrow'
  yearsDisplay: 'always' | 'auto'
  months: 'long' | 'short' | 'narrow'
  monthsDisplay: 'always' | 'auto'
  weeks: 'long' | 'short' | 'narrow'
  weeksDisplay: 'always' | 'auto'
  days: 'long' | 'short' | 'narrow'
  daysDisplay: 'always' | 'auto'
  hours: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  hoursDisplay: 'always' | 'auto'
  minutes: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  minutesDisplay: 'always' | 'auto'
  seconds: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  secondsDisplay: 'always' | 'auto'
  milliseconds: 'long' | 'short' | 'narrow' | 'numeric'
  millisecondsDisplay: 'always' | 'auto'
  microseconds: 'long' | 'short' | 'narrow' | 'numeric'
  microsecondsDisplay: 'always' | 'auto'
  nanoseconds: 'long' | 'short' | 'narrow' | 'numeric'
  nanosecondsDisplay: 'always' | 'auto'
  fractionalDigits?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  numberingSystem: string
  round: boolean
}

export interface DurationFormatPart {
  unit?: string
  type: unknown
  value: string
}

export interface RawDurationLocaleData {
  data: DurationFormatLocaleInternalData
  locale: string
}

export interface DurationFormatLocaleInternalData {
  // Bc of relevantExtensionKeys in the spec
  nu: readonly string[]
  digitalFormat: Record<string, string>
}

export interface DurationFormat {
  resolvedOptions(): ResolvedDurationFormatOptions
  formatToParts(duration: DurationInput): DurationFormatPart[]
  format(duration: DurationInput): string
}

export interface IntlDurationFormatInternal {
  initializedDurationFormat: boolean
  fractionalDigits: number | undefined
  dataLocale: string
  locale: string
  numberingSystem: string
  style: DurationFormatOptions['style']
  years: 'long' | 'short' | 'narrow'
  yearsDisplay: 'always' | 'auto'
  months: 'long' | 'short' | 'narrow'
  monthsDisplay: 'always' | 'auto'
  weeks: 'long' | 'short' | 'narrow'
  weeksDisplay: 'always' | 'auto'
  days: 'long' | 'short' | 'narrow'
  daysDisplay: 'always' | 'auto'
  hours: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  hoursDisplay: 'always' | 'auto'
  minutes: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  minutesDisplay: 'always' | 'auto'
  seconds: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  secondsDisplay: 'always' | 'auto'
  milliseconds: 'long' | 'short' | 'narrow' | 'numeric'
  millisecondsDisplay: 'always' | 'auto'
  microseconds: 'long' | 'short' | 'narrow' | 'numeric'
  microsecondsDisplay: 'always' | 'auto'
  nanoseconds: 'long' | 'short' | 'narrow' | 'numeric'
  nanosecondsDisplay: 'always' | 'auto'
}

export interface DurationInput {
  years?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
  microseconds?: number
  nanoseconds?: number
}

export interface DurationRecord {
  years: number
  months: number
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  microseconds: number
  nanoseconds: number
}

export interface DurationFormatConstructor {
  new (
    locales?: string | string[],
    options?: DurationFormatOptions
  ): DurationFormat
  (locales?: string | string[], options?: DurationFormatOptions): DurationFormat

  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<DurationFormatOptions, 'localeMatcher'>
  ): string[]
  getDefaultLocale(): string

  __defaultLocale: string
  localeData: Record<string, DurationFormatLocaleInternalData | undefined>
  availableLocales: Set<string>
  polyfilled: boolean
}
