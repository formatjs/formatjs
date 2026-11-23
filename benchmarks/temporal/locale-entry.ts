import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import calendars from '#packages/intl-datetimeformat/calendars/all.js'
import en from '#packages/intl-datetimeformat/locale-data-json/en.json' with {type: 'json'}
import {DurationFormat} from '#packages/intl-durationformat/index.js'
import packed from '@formatjs_generated/tz/all-tz.js'
import {Temporal} from '#packages/temporal/index.js'
import {configureLocaleFormatting} from '#packages/temporal/locale.js'

DateTimeFormat.__addLocaleData(en as any)
DateTimeFormat.__addCalendarData(...calendars)
DateTimeFormat.__addTZData(packed)
DateTimeFormat.__addTemporalNamespace(Temporal)
Object.defineProperty(Intl, 'DateTimeFormat', {
  value: DateTimeFormat,
  writable: true,
  configurable: true,
})
Object.defineProperty(Intl, 'DurationFormat', {
  value: DurationFormat,
  writable: true,
  configurable: true,
})
configureLocaleFormatting()
export {Temporal}
