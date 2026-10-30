import {Collator} from '@formatjs/intl-collator'
import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import {DisplayNames} from '@formatjs/intl-displaynames'
import {DurationFormat} from '@formatjs/intl-durationformat'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import ListFormat from '@formatjs/intl-listformat'
import {Locale} from '@formatjs/intl-locale'
import {NumberFormat} from '@formatjs/intl-numberformat'
import {PluralRules} from '@formatjs/intl-pluralrules'
import RelativeTimeFormat from '@formatjs/intl-relativetimeformat'
import {Segmenter} from '@formatjs/intl-segmenter'
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'

const intl = Intl as any
globalThis.__FORMATJS_REFERENCE_INTL = {
  Collator,
  DateTimeFormat,
  DisplayNames,
  DurationFormat,
  getCanonicalLocales,
  ListFormat,
  Locale,
  NumberFormat,
  PluralRules,
  RelativeTimeFormat,
  Segmenter,
  supportedValuesOf,
}
globalThis.__FORMATJS_NATIVE_INTL = Object.fromEntries(
  Object.keys(globalThis.__FORMATJS_REFERENCE_INTL).map(name => [
    name,
    intl[name],
  ])
)
Object.assign(intl, globalThis.__FORMATJS_REFERENCE_INTL)
