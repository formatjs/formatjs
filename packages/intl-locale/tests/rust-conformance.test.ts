import '#packages/intl-getcanonicallocales/polyfill-force.js'
import {Locale} from '#packages/intl-locale/index.js'
import type {IntlLocaleOptions} from '#packages/intl-locale/index.js'
import {supportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'
import {likelySubtags} from '@formatjs_generated/cldr.core/likelySubtags.js'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {expect, it} from 'vitest'

interface Case {
  tag: string
  options?: IntlLocaleOptions
}
interface Request extends Case {
  defaultNumberingSystem?: string
  globalCollations?: string[]
  matchedCollation?: boolean
  acceptedCollations?: string[]
}

const globalCollations = supportedValuesOf('collation')

function prepare(input: Case): {request: Request; expected: unknown} {
  const request: Request = {...input}
  try {
    const value = new Locale(input.tag, input.options)
    const tag = value.toString()
    if (
      value.numberingSystem === undefined &&
      Intl.NumberFormat.supportedLocalesOf([tag], {localeMatcher: 'lookup'})
        .length
    ) {
      request.defaultNumberingSystem = new Intl.NumberFormat(tag, {
        localeMatcher: 'lookup',
      }).resolvedOptions().numberingSystem
    }
    request.globalCollations = globalCollations
    request.matchedCollation = !!Intl.Collator.supportedLocalesOf([tag], {
      localeMatcher: 'lookup',
    }).length
    request.acceptedCollations = request.matchedCollation
      ? globalCollations.filter(
          collation =>
            new Intl.Collator(tag, {
              collation: collation as Intl.CollatorOptions['collation'],
              localeMatcher: 'lookup',
            }).resolvedOptions().collation === collation
        )
      : []
    return {
      request,
      expected: {
        locale: tag,
        baseName: value.baseName,
        language: value.language,
        script: value.script,
        region: value.region,
        variants: value.variants,
        calendar: value.calendar,
        collation: value.collation,
        hourCycle: value.hourCycle,
        caseFirst: value.caseFirst,
        numeric: value.numeric,
        numberingSystem: value.numberingSystem,
        firstDayOfWeek: value.firstDayOfWeek,
        maximized: value.maximize().toString(),
        minimized: value.minimize().toString(),
        calendars: value.getCalendars(),
        collations: value.getCollations(),
        hourCycles: value.getHourCycles(),
        numberingSystems: value.getNumberingSystems(),
        timeZones: value.getTimeZones(),
        textInfo: value.getTextInfo(),
        weekInfo: value.getWeekInfo(),
      },
    }
  } catch (error) {
    return {request, expected: {error: (error as Error).name}}
  }
}

const cases: Case[] = []
for (const tag of [
  'en',
  'en-US',
  'en-GB',
  'ar',
  'ar-EG',
  'ar-SA',
  'fa',
  'he',
  'iw-BU',
  'ja',
  'th',
  'zh-Hant',
  'zh-Hani',
  'und',
  'und-Thai',
  'und-419',
  'und-CW',
  'und-150',
  'und-AQ',
  'und-Zzzz',
  'aae-Latn-IT',
  'abcde',
  'abcde-Arab',
  'en-Arab',
  'ar-Latn',
  'en-US-u-rg-gbzzzz',
  'en-u-sd-gbeng',
  'en-US-u-rg-zzzzzz',
  'hye-Latn-SU',
]) {
  for (const suffix of [
    '',
    '-fonipa',
    '-a-extend-u-co-phonebk-x-private',
    '-u-ca-gregory',
  ]) {
    cases.push({tag: tag + suffix})
  }
}
for (const tag of Object.keys(likelySubtags)
  .sort()
  .filter((_, index) => index % 53 === 0)
  .slice(0, 180))
  cases.push({tag})
for (const options of [
  {language: 'hye'},
  {language: 'abcde'},
  {script: 'Arab'},
  {region: '419'},
  {variants: '1996-FONIPA'},
  {calendar: 'islamicc'},
  {collation: 'foobar'},
  {hourCycle: 'h24'},
  {caseFirst: 'upper'},
  {numeric: true},
  {numeric: false},
  {numberingSystem: 'ARAB'},
  {firstDayOfWeek: '0'},
  {firstDayOfWeek: '7'},
  {firstDayOfWeek: 'MON'},
  {firstDayOfWeek: 'xyz'},
] as IntlLocaleOptions[]) {
  for (const tag of [
    'en',
    'ar-EG-u-ca-buddhist-kn-false-x-private',
    'hye-Latn-SU',
  ])
    cases.push({tag, options})
}
for (const tag of ['', 'root', 'en_US', 'abcd', 'en-1901-1901', 'x-private'])
  cases.push({tag})
for (const options of [
  {language: 'abcd'},
  {script: 'lat'},
  {region: '1234'},
  {variants: ''},
  {variants: 'FONIPA-fonipa'},
  {calendar: 'ab'},
  {hourCycle: 'H12'},
  {caseFirst: 'Upper'},
  {firstDayOfWeek: '08'},
  {numberingSystem: 'foo_bar'},
]) {
  cases.push({tag: 'en', options: options as IntlLocaleOptions})
}

it('matches complete Locale records, information and likely-subtag methods against TypeScript', () => {
  const records = cases.map(prepare)
  expect(records.length).toBeGreaterThan(250)
  const executable = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/crates/intl_locale/conformance`
  )
  const result = spawnSync(executable, [], {
    input:
      records.map(record => JSON.stringify(record.request)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const actual = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(actual.length).toBe(records.length)
  for (const [index, record] of records.entries()) {
    expect(actual[index], JSON.stringify(cases[index])).toEqual(
      JSON.parse(JSON.stringify(record.expected))
    )
  }
}, 60_000)
