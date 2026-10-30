import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {DateTimeFormat as Reference} from '@formatjs/intl-datetimeformat'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {CalendarDateFromTime} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'

type RawLocale = Parameters<typeof Reference.__addLocaleData>[number]
type Patch = Parameters<typeof Reference.__addCalendarLocaleData>[number]
interface Options {
  localeMatcher?: string
  calendar?: string
  numberingSystem?: string
  hourCycle?: string
  hour12?: boolean
}
type Step =
  | {action: 'load'; json: string}
  | {action: 'patch'; json: string}
  | {action: 'provider'; calendar: string}
  | {action: 'info'; locales: string[]}
  | {action: 'resolve'; locales: string[]; options: Options}
  | {action: 'supported'; locales: string[]; localeMatcher?: string}

function raw(source: string): RawLocale {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/packages/intl-datetimeformat/cldr-raw/${source}.json`
  )
  return JSON.parse(readFileSync(path, 'utf8')) as RawLocale
}
function fixture(locale: string, marker = locale, source = 'en'): RawLocale {
  const entry = raw(source)
  entry.locale = locale
  delete entry.data.calendarData
  entry.data.formats = {gregory: {y: `y '${marker}'`}}
  entry.data.am = marker
  return entry
}
function patch(
  locale: string,
  calendar: string,
  marker: string,
  sourceCalendar = calendar
): Patch {
  const data = raw('en').data.calendarData![sourceCalendar]
  data.month.long[0] = marker
  return {locale, calendar, data, formats: {y: `y '${marker}'`}}
}
function run(steps: Step[]): unknown[] {
  const executable = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/crates/intl_datetimeformat/pattern_conformance`
  )
  const result = spawnSync(executable, [], {
    input: JSON.stringify({method: 'registry', steps}) + '\n',
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  return JSON.parse(result.stdout) as unknown[]
}
function reset() {
  Reference.localeData = {}
  Reference.availableLocales = new Set()
  Reference.__defaultLocale = ''
  Reference.calendarData = Object.create(null)
}
function reference(step: Step): unknown {
  try {
    switch (step.action) {
      case 'load':
        Reference.__addLocaleData(JSON.parse(step.json) as RawLocale)
        return null
      case 'patch':
        Reference.__addCalendarLocaleData(JSON.parse(step.json) as Patch)
        return null
      case 'provider':
        Reference.__addCalendarData({
          calendar: step.calendar,
          dateFromTime: milliseconds =>
            CalendarDateFromTime(milliseconds, 'gregory'),
        })
        return null
      case 'supported':
        return Reference.supportedLocalesOf(step.locales, {
          localeMatcher:
            step.localeMatcher as Intl.DateTimeFormatOptions['localeMatcher'],
        })
      case 'resolve': {
        new Reference(step.locales, step.options as Intl.DateTimeFormatOptions)
        const selected = ResolveLocale(
          Reference.availableLocales,
          getCanonicalLocales(step.locales),
          {
            localeMatcher: step.options.localeMatcher ?? 'best fit',
            ca: step.options.calendar,
            nu: step.options.numberingSystem,
            hc:
              step.options.hour12 === undefined ? step.options.hourCycle : null,
          },
          ['nu', 'ca', 'hc'],
          Reference.localeData,
          () => Reference.getDefaultLocale()
        )
        return {
          locale: selected.locale,
          dataLocale: selected.dataLocale,
          calendar: selected.ca,
          numberingSystem: selected.nu,
          hourCycle: selected.hc ?? null,
        }
      }
      case 'info':
        return {
          available: [...Reference.availableLocales],
          default: Reference.getDefaultLocale() || null,
          data: Object.fromEntries(
            step.locales.map(locale => {
              const data = Reference.localeData[locale]
              const calendars = Object.keys(data.formats).sort()
              return [
                locale,
                {
                  am: data.am,
                  ca: data.ca,
                  nu: data.nu,
                  hc: data.hc,
                  calendars,
                  months: Object.fromEntries(
                    calendars.map(calendar => [
                      calendar,
                      (data.calendarData?.[calendar] ?? data).month.long[0] ??
                        null,
                    ])
                  ),
                  patterns: Object.fromEntries(
                    calendars.map(calendar => [
                      calendar,
                      data.formats[calendar][0]?.rawPattern ?? null,
                    ])
                  ),
                },
              ]
            })
          ),
        }
    }
  } catch (error) {
    return {error: (error as Error).name}
  }
}
function compare(steps: Step[]) {
  reset()
  const expected = steps.map(reference),
    actual = run(steps)
  expect(actual.length).toBe(steps.length)
  for (let index = 0; index < steps.length; index++)
    expect(actual[index], `${index}/${steps[index].action}`).toEqual(
      expected[index]
    )
}
const load = (entry: RawLocale): Step => ({
  action: 'load',
  json: JSON.stringify(entry),
})
const addPatch = (entry: Patch): Step => ({
  action: 'patch',
  json: JSON.stringify(entry),
})
const info = (...locales: string[]): Step => ({action: 'info', locales})

it('matches explicit locale precedence, alias replacement, scriptless fallbacks and default locale', () => {
  compare([
    info(),
    load(fixture('en-US', 'us1')),
    info('en-US', 'en'),
    load(fixture('en-GB', 'gb')),
    info('en', 'en-GB'),
    load(fixture('en-US', 'us2')),
    info('en-US', 'en'),
    load(fixture('en', 'parent')),
    info('en', 'en-US', 'en-GB'),
    load(fixture('en-US', 'us3')),
    info('en', 'en-US', 'en-GB'),
    load(fixture('zh-Hant-TW', 'tw')),
    info('zh-TW', 'zh-Hant', 'zh'),
    load(fixture('zh', 'zh-parent')),
    info('zh-TW', 'zh-Hant-TW', 'zh'),
    load(fixture('zh-Hant-TW', 'tw2')),
    info('zh-TW', 'zh-Hant-TW', 'zh'),
  ])
})
it('matches calendar patches before base data, provider ordering, replacement and base reloads', () => {
  const first = 'en-patch1',
    second = 'en-patch2'
  compare([
    addPatch(patch(first, 'buddhist', 'before-base')),
    info(),
    {action: 'provider', calendar: 'buddhist'},
    info(),
    load(fixture(first, 'first')),
    info(first, 'en'),
    addPatch(patch(first, 'buddhist', 'replaced')),
    info(first, 'en'),
    addPatch(patch(first, 'coptic', 'coptic')),
    info(first),
    {action: 'provider', calendar: 'coptic'},
    info(first),
    addPatch(patch(first, 'custom', 'custom', 'buddhist')),
    info(first),
    {action: 'provider', calendar: 'custom'},
    info(first),
    {action: 'resolve', locales: [first], options: {calendar: 'custom'}},
    load(fixture(first, 'first-reloaded')),
    info(first, 'en'),
    load(fixture(second, 'second')),
    info(second, 'en'),
    addPatch(patch(second, 'buddhist', 'after-base')),
    info(second, 'en'),
  ])
})
it('matches locale/Unicode option negotiation, overrides and supportedLocalesOf', () => {
  const steps: Step[] = ['en', 'fr', 'ar', 'ja', 'zh-Hans'].map(locale =>
    load(fixture(locale, locale, locale))
  )
  steps.push(
    addPatch(patch('en', 'buddhist', 'buddhist')),
    addPatch(patch('en', 'islamic-civil', 'islamic')),
    {action: 'provider', calendar: 'buddhist'},
    {action: 'provider', calendar: 'islamic-civil'}
  )
  const requests = [
    [],
    ['en'],
    ['en-US'],
    ['en-AU'],
    ['fr-CA'],
    ['ar-EG'],
    ['ja-JP'],
    ['zh-TW'],
    ['zz-ZZ', 'fr'],
    ['de', 'fr', 'en'],
    ['en-u-ca-buddhist-hc-h11-nu-thai'],
    ['en-u-ca-islamicc-hc-h24-nu-arab'],
    ['en-u-nu-arab', 'en-u-nu-thai'],
    ['fr-u-ca-iso8601-hc-h24-nu-hanidec'],
  ]
  for (const localeMatcher of ['lookup', 'best fit']) {
    steps.push({
      action: 'supported',
      locales: ['EN-us', 'en-US', 'iw', 'sh', 'fr-CA', 'zz-ZZ', 'ja-u-hc-h11'],
      localeMatcher,
    })
    for (const locales of requests)
      for (const calendar of [
        undefined,
        'gregory',
        'iso8601',
        'buddhist',
        'ISLAMICC',
        'foobar',
      ])
        for (const numberingSystem of [
          undefined,
          'LATN',
          'arab',
          'hanidec',
          'foobar',
        ])
          for (const hourCycle of [undefined, 'h11', 'h12', 'h23', 'h24'])
            for (const hour12 of [undefined, false, true])
              steps.push({
                action: 'resolve',
                locales,
                options: {
                  localeMatcher,
                  calendar,
                  numberingSystem,
                  hourCycle,
                  hour12,
                },
              })
  }
  compare(steps)
}, 120000)
it('rejects malformed tags/options even when hour12 overrides hourCycle', () => {
  const options: Options[] = [
    {localeMatcher: 'other'},
    {calendar: 'gregorian'},
    {calendar: 'ab'},
    {calendar: 'abc-'},
    {numberingSystem: 'latn\n'},
    {numberingSystem: 'ab'},
    {hourCycle: 'H12'},
    {hourCycle: 'h25'},
    {hourCycle: 'h25', hour12: true},
  ]
  compare([
    load(fixture('en', 'errors')),
    ...options.map(options => ({
      action: 'resolve' as const,
      locales: ['en'],
      options,
    })),
    {action: 'resolve', locales: ['en-ü'], options: {}},
    {action: 'supported', locales: ['en'], localeMatcher: 'other'},
  ])
})

it('preserves published locale records when an eager style fails to load', () => {
  const previous = fixture('en-atom1', 'previous'),
    replacement = fixture('en-atom1', 'replacement')
  const broken = fixture('en-atom1', 'broken')
  broken.data.dateFormat.full = 'Q'
  const newBroken = fixture('fr-fail1', 'new-broken')
  newBroken.data.dateFormat.full = 'Q'
  compare([
    load(previous),
    info('en-atom1', 'en'),
    load(broken),
    info('en-atom1', 'en'),
    load(newBroken),
    info('en-atom1', 'en'),
    load(replacement),
    info('en-atom1', 'en'),
  ])
})

it('isolates core calendar names/styles while sharing Gregorian/ISO format lists', () => {
  const first = 'en-core1',
    second = 'en-core2'
  const gregory = patch(first, 'gregory', 'Gregorian names', 'buddhist')
  const iso = patch(first, 'iso8601', 'ISO names', 'buddhist')
  const brokenGregory = structuredClone(gregory)
  brokenGregory.data.dateFormat.full = 'Q'
  const brokenIso = structuredClone(iso)
  brokenIso.data.dateFormat.full = 'Q'
  const brokenBase = fixture(first, 'invalid root')
  brokenBase.data.dateFormat.full = 'Q'
  compare([
    load(fixture(first, 'base')),
    addPatch(iso),
    info(first),
    addPatch(gregory),
    info(first),
    load(fixture(second, 'base2')),
    addPatch(patch(second, 'gregory', 'Only Gregorian', 'buddhist')),
    info(second),
    addPatch(brokenGregory),
    info(first),
    addPatch(gregory),
    info(first),
    addPatch(brokenIso),
    info(first),
    addPatch(iso),
    info(first),
    load(brokenBase),
    info(first),
    load(fixture(first, 'reloaded')),
    info(first),
  ])
})
