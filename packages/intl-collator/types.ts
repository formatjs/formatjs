export type CollatorUsage = 'sort' | 'search'
export type CollatorSensitivity = 'base' | 'accent' | 'case' | 'variant'
export type CollatorCaseFirst = 'upper' | 'lower' | 'false'

export interface CollatorOptions {
  usage?: CollatorUsage
  localeMatcher?: 'lookup' | 'best fit'
  collation?: string
  numeric?: boolean
  caseFirst?: CollatorCaseFirst
  sensitivity?: CollatorSensitivity
  ignorePunctuation?: boolean
}

export interface ResolvedCollatorOptions {
  locale: string
  usage: CollatorUsage
  sensitivity: CollatorSensitivity
  ignorePunctuation: boolean
  collation: string
  numeric: boolean
  caseFirst: CollatorCaseFirst
}

export interface IntlCollatorInternal {
  initializedCollator?: boolean
  locale: string
  usage: CollatorUsage
  collation: string
  numeric: boolean
  caseFirst: CollatorCaseFirst
  sensitivity: CollatorSensitivity
  ignorePunctuation: boolean
  boundCompare?: (x: string, y: string) => number
}

export interface Collator extends Intl.Collator {
  resolvedOptions(): ResolvedCollatorOptions
}

export interface CollatorConstructor {
  new (locales?: string | string[], options?: CollatorOptions): Collator
  (locales?: string | string[], options?: CollatorOptions): Collator
  supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<CollatorOptions, 'localeMatcher'>
  ): string[]
  availableLocales: Set<string>
  relevantExtensionKeys: string[]
  getDefaultLocale(): string
  localeData: Record<string, CollatorLocaleData | undefined>
  polyfilled: boolean
}

export interface CollatorLocaleData {
  co: string[]
  kn: string[]
  kf: string[]
  sensitivity: CollatorSensitivity
  ignorePunctuation: boolean
}
