import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'
import {DateTimeFormat} from '#packages/intl-datetimeformat/index.js'
import {
  toLocaleDateString as _toLocaleDateString,
  toLocaleString as _toLocaleString,
  toLocaleTimeString as _toLocaleTimeString,
} from '#packages/intl-datetimeformat/to_locale_string.js'

const intl = ensureIntl()

defineProperty(intl, 'DateTimeFormat', {value: DateTimeFormat})
defineProperty(Date.prototype, 'toLocaleString', {
  value: function toLocaleString(
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    try {
      return _toLocaleString(this, locales, options)
    } catch {
      return 'Invalid Date'
    }
  },
})
defineProperty(Date.prototype, 'toLocaleDateString', {
  value: function toLocaleDateString(
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    try {
      return _toLocaleDateString(this, locales, options)
    } catch {
      return 'Invalid Date'
    }
  },
})
defineProperty(Date.prototype, 'toLocaleTimeString', {
  value: function toLocaleTimeString(
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    try {
      return _toLocaleTimeString(this, locales, options)
    } catch {
      return 'Invalid Date'
    }
  },
})

// Optional calendars and their locale patterns can be loaded before installation.
for (const [key, register] of [
  [
    '__FORMATJS_DATETIMEFORMAT_CALENDAR_DATA__',
    DateTimeFormat.__addCalendarData,
  ],
  [
    '__FORMATJS_DATETIMEFORMAT_CALENDAR_LOCALE_DATA__',
    DateTimeFormat.__addCalendarLocaleData,
  ],
] as const) {
  const globals = globalThis as Record<string, unknown>
  const queue = globals[key] as any[] | undefined
  if (queue) {
    for (const data of queue) register(data)
    delete globals[key]
  }
}

// Drain any locale data that was buffered before polyfill loaded
const buf = (globalThis as Record<string, unknown>)
  .__FORMATJS_DATETIMEFORMAT_DATA__ as
  | Parameters<(typeof DateTimeFormat)['__addLocaleData']>[0][]
  | undefined
if (buf) {
  for (const d of buf) DateTimeFormat.__addLocaleData(d)
  delete (globalThis as Record<string, unknown>)
    .__FORMATJS_DATETIMEFORMAT_DATA__
}
