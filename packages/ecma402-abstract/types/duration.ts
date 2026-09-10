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

export type DurationFormatOptions = Partial<
  Omit<ResolvedDurationFormatOptions, 'locale'>
> & {
  localeMatcher?: 'best fit' | 'lookup'
}

export interface ResolvedDurationFormatOptions {
  locale: string
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
}

export interface DurationFormatPart {
  unit?: string
  type: unknown
  value: string
}

export interface DurationFormat {
  resolvedOptions(): ResolvedDurationFormatOptions
  formatToParts(duration: DurationInput | string): DurationFormatPart[]
  format(duration: DurationInput | string): string
}
