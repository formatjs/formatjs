import {readFileSync} from 'node:fs'
import {cpus, release} from 'node:os'
import {performance} from 'node:perf_hooks'
import {runInNewContext} from 'node:vm'
import {runfiles} from '@bazel/runfiles'
import {Collator} from '@formatjs/intl-collator'
import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import {DisplayNames} from '@formatjs/intl-displaynames'
import {DurationFormat} from '@formatjs/intl-durationformat'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import ListFormat from '@formatjs/intl-listformat'
import {Locale} from '@formatjs/intl-locale'
import {match} from '@formatjs/intl-localematcher'
import {NumberFormat} from '@formatjs/intl-numberformat'
import {PluralRules} from '@formatjs/intl-pluralrules'
import RelativeTimeFormat from '@formatjs/intl-relativetimeformat'
import {Segmenter} from '@formatjs/intl-segmenter'
import {supportedValuesOf} from '@formatjs/intl-supportedvaluesof'
import cldr from 'cldr-core/availableLocales.json' with {type: 'json'}

type NumberRangeFormatter = Intl.NumberFormat &
  Pick<NumberFormat, 'formatRange' | 'formatRangeToParts'>

function main() {
  const native = Object.fromEntries(
    Object.getOwnPropertyNames(Intl).map(key => [
      key,
      Object.getOwnPropertyDescriptor(Intl, key)?.value,
    ])
  ) as unknown as typeof Intl
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  for (const [name, constructor] of [
    ['datetimeformat', DateTimeFormat],
    ['displaynames', DisplayNames],
    ['listformat', ListFormat],
    ['numberformat', NumberFormat],
    ['relativetimeformat', RelativeTimeFormat],
  ] as const) {
    constructor.__addLocaleData(
      JSON.parse(
        readFileSync(resolve(`packages/intl-${name}/cldr-raw/en.json`), 'utf8')
      )
    )
  }
  PluralRules.__addLocaleData(
    runInNewContext(
      `(${readFileSync(resolve('packages/intl-pluralrules/cldr-raw/en.js'), 'utf8')})`
    )
  )
  DateTimeFormat.__addTZData(
    JSON.parse(
      readFileSync(resolve('packages/intl-datetimeformat/tz-all.json'), 'utf8')
    )
  )

  const polyfillAPIs = {
    Collator,
    DateTimeFormat,
    DisplayNames,
    DurationFormat,
    ListFormat,
    Locale,
    NumberFormat,
    PluralRules,
    RelativeTimeFormat,
    Segmenter,
    getCanonicalLocales,
    supportedValuesOf,
  } as unknown as typeof Intl
  const full = process.argv.includes('--polyfill-dependencies')
  if (full) {
    Object.assign(Intl, polyfillAPIs)
  }
  const rounds = 7
  const values = [0, -0, 1.025, -1.025, 1234.5, 999.5, 999999.5, 1e-7, 1e21]
  const dates = [
    Date.UTC(2024, 0, 15, 13, 45, 12, 345),
    Date.UTC(2024, 6, 15, 1, 5, 42, 678),
  ]
  const texts = [
    'Hello, world! Café 👨‍👩‍👧‍👦. A second sentence.',
    '日本語の文章です。Hello again!',
  ]
  const tasks: {
    name: string
    implementation: string
    run: (i: number) => unknown
  }[] = []
  function add(
    name: string,
    implementation: string,
    run: (i: number) => unknown
  ) {
    tasks.push({name, implementation, run})
  }
  for (const [implementation, apis] of [
    ['polyfill', polyfillAPIs],
    ['native', native],
  ] as const) {
    for (const [name, options] of [
      ['decimal', {}],
      ['currency', {style: 'currency', currency: 'USD'}],
      ['unit', {style: 'unit', unit: 'meter', unitDisplay: 'long'}],
      ['percent', {style: 'percent'}],
      ['scientific', {notation: 'scientific'}],
      ['compact', {notation: 'compact'}],
      ['significant digits', {maximumSignificantDigits: 3}],
    ] as const) {
      const formatter = new apis.NumberFormat(
        'en',
        options
      ) as NumberRangeFormatter
      add(`NumberFormat format ${name}`, implementation, i =>
        formatter.format(values[i % values.length])
      )
      if (name === 'decimal') {
        add('NumberFormat formatToParts', implementation, i =>
          formatter.formatToParts(values[i % values.length])
        )
        add('NumberFormat formatRange', implementation, () =>
          formatter.formatRange(1234.5, 6789.5)
        )
        add('NumberFormat formatRangeToParts', implementation, () =>
          formatter.formatRangeToParts(1234.5, 6789.5)
        )
        add('NumberFormat time values x60', implementation, () => {
          let total = 0
          for (let n = 0; n < 60; n++) total += formatter.format(n).length
          return total
        })
      }
    }
    for (const [name, options] of [
      ['date', {timeZone: 'UTC'}],
      [
        'date time',
        {timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'medium'},
      ],
      [
        'fractional seconds',
        {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        },
      ],
      [
        'zone name',
        {timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'long'},
      ],
    ] as const) {
      const formatter = new apis.DateTimeFormat('en', options)
      add(`DateTimeFormat format ${name}`, implementation, i =>
        formatter.format(dates[i % dates.length])
      )
      if (name === 'date') {
        add('DateTimeFormat formatToParts', implementation, i =>
          formatter.formatToParts(dates[i % dates.length])
        )
        add('DateTimeFormat formatRange', implementation, () =>
          formatter.formatRange(dates[0], dates[1])
        )
        add('DateTimeFormat formatRangeToParts', implementation, () =>
          formatter.formatRangeToParts(dates[0], dates[1])
        )
      }
    }
    for (const [name, locale, options, left, right] of [
      ['Latin', 'en', {}, 'apple', 'banana'],
      ['accent', 'en', {}, 'café', 'cafe'],
      ['numeric', 'en', {numeric: true}, 'item 9', 'item 10'],
      ['normalization', 'en', {}, 'café', 'cafe\u0301'],
      ['Swedish', 'sv', {}, 'zebra', 'ångström'],
      ['CJK', 'zh', {}, '中文', '汉字'],
    ] as const) {
      const formatter = new apis.Collator(locale, options)
      add(`Collator compare ${name}`, implementation, i =>
        i % 2 ? formatter.compare(left, right) : formatter.compare(right, left)
      )
    }
    for (const granularity of ['grapheme', 'word', 'sentence'] as const) {
      const formatter = new apis.Segmenter('en', {granularity})
      add(`Segmenter iterate ${granularity}`, implementation, i => {
        let total = 0
        for (const item of formatter.segment(texts[i % texts.length]))
          total += item.segment.length
        return total
      })
      add(
        `Segmenter containing ${granularity}`,
        implementation,
        i => formatter.segment(texts[i % texts.length]).containing(7)?.segment
      )
    }
    const display = new apis.DisplayNames('en', {type: 'language'})
    add('DisplayNames of language', implementation, i =>
      display.of(['fr', 'de', 'ja'][i % 3])
    )
    const list = new apis.ListFormat('en', {style: 'long', type: 'conjunction'})
    add('ListFormat format', implementation, () =>
      list.format(['apple', 'banana', 'cherry'])
    )
    add('ListFormat formatToParts', implementation, () =>
      list.formatToParts(['apple', 'banana', 'cherry'])
    )
    const relative = new apis.RelativeTimeFormat('en', {numeric: 'auto'})
    add('RelativeTimeFormat format', implementation, i =>
      relative.format((i % 7) - 3, 'day')
    )
    add('RelativeTimeFormat formatToParts', implementation, i =>
      relative.formatToParts((i % 7) - 3, 'day')
    )
    for (const type of ['cardinal', 'ordinal'] as const) {
      const plural = new apis.PluralRules('en', {type})
      add(`PluralRules select ${type}`, implementation, i =>
        plural.select(values[i % values.length])
      )
    }
    if (apis.DurationFormat) {
      for (const style of ['long', 'digital'] as const) {
        const formatter = new apis.DurationFormat('en', {style})
        const duration = {hours: 1, minutes: 23, seconds: 45, milliseconds: 123}
        add(`DurationFormat format ${style}`, implementation, () =>
          formatter.format(duration)
        )
        add(`DurationFormat formatToParts ${style}`, implementation, () =>
          formatter.formatToParts(duration)
        )
      }
    }
    add('getCanonicalLocales aliases', implementation, () =>
      apis.getCanonicalLocales(['iw-IL', 'en-us', 'zh-hant-tw', 'en-US'])
    )
    add('Locale construct', implementation, i =>
      new apis.Locale(['en-US', 'sr-Latn', 'zh-TW'][i % 3]).toString()
    )
    const locale = new apis.Locale('zh-TW')
    add('Locale maximize', implementation, () => locale.maximize().toString())
    for (const key of ['calendar', 'timeZone', 'unit'] as const)
      add(`supportedValuesOf ${key}`, implementation, () =>
        apis.supportedValuesOf(key)
      )
    for (const [name, Constructor, options] of [
      ['Collator', apis.Collator, {}],
      ['DateTimeFormat', apis.DateTimeFormat, {timeZone: 'UTC'}],
      ['DisplayNames', apis.DisplayNames, {type: 'language'}],
      ['ListFormat', apis.ListFormat, {}],
      ['NumberFormat', apis.NumberFormat, {}],
      ['PluralRules', apis.PluralRules, {}],
      ['RelativeTimeFormat', apis.RelativeTimeFormat, {}],
      ['Segmenter', apis.Segmenter, {}],
      ['DurationFormat', apis.DurationFormat, {style: 'digital'}],
    ] as const) {
      if (Constructor)
        add(
          `${name} construct`,
          implementation,
          () =>
            new (Constructor as unknown as new (
              locale: string,
              options: object
            ) => {resolvedOptions(): {locale: string}})(
              'en',
              options
            ).resolvedOptions().locale
        )
    }
  }
  const available = cldr.availableLocales.full
  for (const requested of ['en', 'en-US', 'zh-TW', 'sr-Latn-BA', 'en-XZ']) {
    add(`LocaleMatcher best fit ${requested}`, 'polyfill', () =>
      match([requested], available, 'en')
    )
  }
  add('LocaleMatcher fresh array', 'polyfill', () =>
    match(['en'], [...available], 'en')
  )

  let checksum = 0
  function consume(value: unknown) {
    checksum =
      (checksum +
        (typeof value === 'string'
          ? value.length
          : typeof value === 'number'
            ? value
            : Array.isArray(value)
              ? value.length
              : 0)) |
      0
  }
  function batch(run: (i: number) => unknown, count: number) {
    const start = performance.now()
    for (let i = 0; i < count; i++) consume(run(i))
    return performance.now() - start
  }
  const results = []
  for (const task of tasks) {
    let count = 1
    while (batch(task.run, count) < 50) count *= 2
    const samples = Array.from(
      {length: rounds},
      () => (batch(task.run, count) * 1000) / count
    ).sort((a, b) => a - b)
    const medianMicroseconds = samples[Math.floor(rounds / 2)]
    const result = {
      sample: task.run(0),
      name: task.name,
      implementation: task.implementation,
      iterationsPerRound: count,
      medianMicroseconds,
      minMicroseconds: samples[0],
      maxMicroseconds: samples[samples.length - 1],
      operationsPerSecond: 1e6 / medianMicroseconds,
    }
    results.push(result)
    console.error(
      `${task.implementation}: ${task.name}: ${medianMicroseconds.toFixed(3)} us`
    )
  }
  console.log(
    JSON.stringify(
      {
        sourceRevision:
          process.argv
            .find(value => value.startsWith('--revision='))
            ?.slice('--revision='.length) ?? 'unspecified',
        measuredAt: new Date().toISOString(),
        node: process.version,
        icu: process.versions.icu,
        platform: process.platform,
        arch: process.arch,
        os: release(),
        cpu: cpus()[0].model,
        dependencies: full ? 'polyfill' : 'host',
        locale: 'en',
        availableLocales: available.length,
        rounds,
        checksum,
        results,
      },
      null,
      2
    )
  )
}

if (import.meta.filename === process.argv[1]) main()
