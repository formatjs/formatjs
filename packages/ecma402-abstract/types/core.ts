export type Locale = string
export interface LocaleData<T> {
  data: T
  locale: Locale
}

export interface LookupMatcherResult {
  locale: string
  extension?: string
  nu?: string
}
