import {
  CanonicalizeLocaleList,
  GetOption,
  ToObject,
} from '@formatjs/ecma402-abstract'
import {ResolveLocale} from '@formatjs/intl-localematcher'
export interface DurationFormatOptions {
  style: 'long' | 'short' | 'narrow' | 'digital'
  smallestUnit: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'
  largestUnit: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'
  hideZeroValues:
    | 'all'
    | 'leadingAndTrailing'
    | 'leadingOnly'
    | 'trailingOnly'
    | 'none'
  numberingSystem: string
  round: boolean
}

export class DurationFormat {
  constructor(locales?: string | string[], options?: DurationFormatOptions) {
    // test262/test/intl402/ListFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof DurationFormat ? this.constructor : void 0
    if (!newTarget) {
      throw new TypeError("Intl.DurationFormat must be called with 'new'")
    }
    const requestedLocales = CanonicalizeLocaleList(locales)
    const opt: any = Object.create(null)
    const opts = options === undefined ? Object.create(null) : ToObject(options)
    const matcher = GetOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    )
    opt.localeMatcher = matcher
    // const numberingSystem = GetOption(
    //   opts,
    //   'numberingSystem',
    //   'string',
    //   undefined,
    //   undefined
    // );
    // @ts-expect-error TODO
    const {localeData} = DurationFormat
    const r = ResolveLocale(
      localeData.availableLocales,
      requestedLocales,
      opt,
      // [[RelevantExtensionKeys]] slot, which is a constant
      ['nu'],
      localeData,
      DurationFormat.getDefaultLocale
    )
    console.log('TODO', r)
  }
  static __defaultLocale: string
  static getDefaultLocale() {
    return DurationFormat.__defaultLocale
  }
}
