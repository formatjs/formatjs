import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import ListFormat from '@formatjs/intl-listformat'
import {NumberFormat} from '@formatjs/intl-numberformat'
import {PluralRules} from '@formatjs/intl-pluralrules'

const intl = Intl as any
globalThis.__FORMATJS_NATIVE_INTL = {
  DateTimeFormat: intl.DateTimeFormat,
  ListFormat: intl.ListFormat,
  NumberFormat: intl.NumberFormat,
  PluralRules: intl.PluralRules,
}
intl.DateTimeFormat = DateTimeFormat
intl.ListFormat = ListFormat
intl.NumberFormat = NumberFormat
intl.PluralRules = PluralRules
