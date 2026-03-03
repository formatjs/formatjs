import type {
  DurationFormat as DurationFormatType,
  DurationFormatOptions,
  DurationFormatPart,
  DurationInput,
  ResolvedDurationFormatOptions,
} from './src/types.js'

declare global {
  namespace Intl {
    interface DurationFormat extends DurationFormatType {}
    var DurationFormat: {
      prototype: DurationFormat
      new (
        locales?: string | string[],
        options?: DurationFormatOptions
      ): DurationFormat
      supportedLocalesOf(
        locales: string | string[],
        options?: Pick<DurationFormatOptions, 'localeMatcher'>
      ): string[]
    }
  }
}

export type {
  DurationFormatOptions,
  DurationFormatPart,
  DurationInput,
  ResolvedDurationFormatOptions,
}

export * from './src/core.js'
