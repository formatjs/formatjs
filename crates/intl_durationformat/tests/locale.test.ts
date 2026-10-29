import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {DurationFormat} from '@formatjs/intl-durationformat'
import {NumberFormat} from '@formatjs/intl-numberformat'
import type {DurationFormatOptions} from '@formatjs/intl-durationformat'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
function run(requests: object[]): unknown[] {
  const result = spawnSync(
    resolve('crates/intl_durationformat/conformance'),
    [],
    {
      input: requests.map(request => JSON.stringify(request)).join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  return result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
}
function safely(callback: () => unknown): unknown {
  try {
    return callback()
  } catch (error) {
    return {error: (error as Error).name}
  }
}
it('matches static availability and locale/numbering negotiation before and after dependency loading', () => {
  Object.defineProperty(Intl, 'NumberFormat', {
    value: NumberFormat,
    configurable: true,
    writable: true,
  })
  const available = [...DurationFormat.availableLocales]
  const requests: object[] = [{method: 'available'}]
  const expected: unknown[] = [available]
  function check(locales: string[], options: DurationFormatOptions) {
    requests.push({method: 'resolved', locales, resolution: options, options})
    expected.push(
      safely(() => new DurationFormat(locales, options).resolvedOptions())
    )
  }
  // No NumberFormat data yet: metadata defaults work, unsupported probes must retry.
  check(['en-u-nu-arab'], {})
  check(['fa'], {numberingSystem: 'deva'})
  const pack = readFileSync(
    resolve('crates/intl_numberformat/locale-data/en.json'),
    'utf8'
  )
  NumberFormat.__addLocaleData(JSON.parse(pack))
  requests.push({method: 'numberData', data: pack})
  expected.push(true)
  for (const localeMatcher of ['lookup', 'best fit'] as const) {
    for (const locale of available) {
      check([locale], {localeMatcher})
      check([locale + '-u-nu-arab'], {localeMatcher, style: 'digital'})
      check([locale], {localeMatcher, numberingSystem: 'latn'})
    }
    for (const locales of [
      [],
      ['zz'],
      ['en-XX'],
      ['fr-XX'],
      ['zh-Hant-XX'],
      ['zz-u-nu-arab', 'fr-u-nu-deva'],
      ['en-u-nu-arab', 'en-u-nu-deva'],
      ['de-u-ca-gregory-nu-arab-x-private'],
      ['en-US-posix'],
    ]) {
      for (const numberingSystem of [
        undefined,
        'latn',
        'ARAB',
        'deva',
        'hanidec',
        'roman',
        'unknown',
        'true',
        '',
        'ab',
        'latn\n',
      ])
        check(locales, {
          localeMatcher,
          numberingSystem,
          style: 'digital',
          fractionalDigits: 3,
        })
    }
    for (const locales of [
      ['en-u-nu-arab', 'zz', 'fr-XX', 'zh-Hant-XX'],
      ['zz'],
      [],
      ['en_US'],
    ]) {
      requests.push({method: 'supported', locales, resolution: {localeMatcher}})
      expected.push(
        safely(() =>
          DurationFormat.supportedLocalesOf(locales, {localeMatcher})
        )
      )
    }
  }
  check(['en'], {localeMatcher: 'invalid' as 'lookup'})
  check(['en_US'], {})
  const actual = run(requests)
  expect(actual.length).toBe(expected.length)
  for (let index = 0; index < requests.length; index++) {
    expect(actual[index], JSON.stringify(requests[index])).toEqual(
      expected[index]
    )
    expect(Object.keys(actual[index] as object)).toEqual(
      Object.keys(expected[index] as object)
    )
  }
}, 120_000)
