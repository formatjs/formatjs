import {basename, dirname, join} from 'node:path'
import {readFileSync, readdirSync} from 'node:fs'
import numberingSystems from 'cldr-core/supplemental/numberingSystems.json' with {type: 'json'}
import parents from 'cldr-core/supplemental/parentLocales.json' with {type: 'json'}
import likelySubtags from 'cldr-core/supplemental/likelySubtags.json' with {type: 'json'}
import {isEqual} from 'lodash-es'
import {
  type RawNumberData,
  type SymbolsData,
  type DecimalFormatNum,
  type RawCurrencyData,
  type LDMLPluralRuleMap,
} from '#packages/ecma402-abstract/types/number.js'
import {
  NumberDataResolver,
  type NumberPathPart,
} from '#packages/intl-numberformat/scripts/number-data/number-data.js'
import {collapseSingleValuePluralRule, PLURAL_RULES} from './utils.ts'

const part = (
  name: string,
  attributes?: Record<string, string>
): NumberPathPart => ({name, attributes})
const NUMERIC_SYSTEMS = Object.keys(
  numberingSystems.supplemental.numberingSystems
).filter(
  name =>
    numberingSystems.supplemental.numberingSystems[name as 'latn']._type ===
    'numeric'
)
const COUNTS = Array.from(
  {length: 12},
  (_, i) => String(10 ** (i + 3)) as DecimalFormatNum
)
type SystemData = {
  symbols: SymbolsData
  decimal: RawNumberData['decimal'][string]
  percent: string
  currency: RawCurrencyData
}

export function numberParent(locale: string): string | undefined {
  if (locale === 'root') return undefined
  const explicit = (
    parents.supplemental.parentLocales.parentLocale as Record<string, string>
  )[locale]
  if (explicit) return explicit === 'und' ? 'root' : explicit
  const pieces = locale.split('-')
  // LDML main data does not inherit across a change of script.
  // https://unicode.org/reports/tr35/tr35.html#Parent_Locales
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L2118-L2128
  if (pieces.length === 2 && pieces[1].length === 4) {
    const likely = (
      likelySubtags.supplemental.likelySubtags as Record<string, string>
    )[pieces[0]]
    if (likely && likely.split('-')[1] !== pieces[1]) return 'root'
  }
  return pieces.length > 1 ? pieces.slice(0, -1).join('-') : 'root'
}

export function loadNumberResolver(rootFile: string): NumberDataResolver {
  const directory = dirname(rootFile)
  const sources = new Map<string, string>()
  for (const file of readdirSync(directory).sort()) {
    if (file.endsWith('.xml'))
      sources.set(
        basename(file, '.xml').replace(/_/g, '-'),
        readFileSync(join(directory, file), 'utf8')
      )
  }
  return new NumberDataResolver(sources, numberParent)
}

function readSystem(
  resolver: NumberDataResolver,
  locale: string,
  system: string
): SystemData {
  const section = (name: string) => part(name, {numberSystem: system})
  const get = (...path: NumberPathPart[]) => resolver.get(locale, path)
  const required = (...path: NumberPathPart[]) => {
    const value = get(...path)
    if (value === undefined)
      throw new Error(
        `Missing number data: ${locale}/${system}/${JSON.stringify(path)}`
      )
    return value
  }
  const symbols = {} as SymbolsData
  for (const name of [
    'decimal',
    'group',
    'list',
    'percentSign',
    'plusSign',
    'minusSign',
    'exponential',
    'superscriptingExponent',
    'perMille',
    'infinity',
    'nan',
    'timeSeparator',
    'approximatelySign',
  ] as const) {
    symbols[name] = required(section('symbols'), part(name))
  }
  for (const name of ['currencyDecimal', 'currencyGroup'] as const) {
    const value = get(section('symbols'), part(name))
    if (value !== undefined) symbols[name] = value
  }
  for (const [name, alt] of [
    ['decimal', 'us'],
    ['group', 'us'],
    ['timeSeparator', 'variant'],
  ]) {
    const value = get(section('symbols'), part(name, {alt}))
    if (value !== undefined)
      Object.assign(symbols, {[`${name}-alt-${alt}`]: value})
  }
  const range = required(
    section('miscPatterns'),
    part('pattern', {type: 'range'})
  )
  if (!range.startsWith('{0}') || !range.endsWith('{1}'))
    throw new Error(`Unsupported number range pattern: ${range}`)
  symbols.rangeSign = range.slice(3, -3)
  const compact = (kind: 'decimal' | 'currency', length: 'long' | 'short') => {
    const base = [
      section(`${kind}Formats`),
      part(`${kind}FormatLength`, {type: length}),
      part(
        `${kind}Format`,
        kind === 'currency' ? {type: 'standard'} : undefined
      ),
    ]
    const result = {} as Record<DecimalFormatNum, LDMLPluralRuleMap<string>>
    for (const count of COUNTS) {
      const rules = {
        other: required(
          ...base,
          part('pattern', {type: count, count: 'other'})
        ),
      } as LDMLPluralRuleMap<string>
      for (const plural of PLURAL_RULES) {
        const value = get(
          ...base,
          part('pattern', {type: count, count: plural})
        )
        if (value !== undefined) rules[plural] = value
      }
      result[count] = collapseSingleValuePluralRule(rules)
    }
    return result
  }
  const currency: RawCurrencyData = {
    currencySpacing: {
      beforeInsertBetween: required(
        section('currencyFormats'),
        part('currencySpacing'),
        part('beforeCurrency'),
        part('insertBetween')
      ),
      afterInsertBetween: required(
        section('currencyFormats'),
        part('currencySpacing'),
        part('afterCurrency'),
        part('insertBetween')
      ),
    },
    standard: required(
      section('currencyFormats'),
      part('currencyFormatLength'),
      part('currencyFormat', {type: 'standard'}),
      part('pattern')
    ),
    accounting: required(
      section('currencyFormats'),
      part('currencyFormatLength'),
      part('currencyFormat', {type: 'accounting'}),
      part('pattern')
    ),
    unitPattern:
      get(section('currencyFormats'), part('unitPattern', {count: 'other'})) ??
      required(
        part('currencyFormats', {numberSystem: 'latn'}),
        part('unitPattern', {count: 'other'})
      ),
  }
  if (
    get(
      section('currencyFormats'),
      part('currencyFormatLength', {type: 'short'}),
      part('currencyFormat', {type: 'standard'}),
      part('pattern', {type: '1000', count: 'other'})
    ) !== undefined
  ) {
    currency.short = compact('currency', 'short')
  }
  return {
    symbols,
    percent: required(
      section('percentFormats'),
      part('percentFormatLength'),
      part('percentFormat'),
      part('pattern')
    ),
    decimal: {
      standard: required(
        section('decimalFormats'),
        part('decimalFormatLength'),
        part('decimalFormat'),
        part('pattern')
      ),
      long: compact('decimal', 'long'),
      short: compact('decimal', 'short'),
    },
    currency,
  }
}

export function expandNumberingSystems(
  locale: string,
  existing: RawNumberData,
  resolver: NumberDataResolver
): RawNumberData {
  // ECMA-402 16.5.5, step 4.c.iii.1.a: substitute the selected system's digits.
  // Resolve its LDML symbols and patterns too; digit substitution alone is insufficient.
  // https://tc39.es/ecma402/#sec-partitionnotationsubpattern
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L844-L855
  const result: RawNumberData = {
    minimumGroupingDigits: existing.minimumGroupingDigits,
    nu: [
      ...existing.nu,
      ...NUMERIC_SYSTEMS.filter(name => !existing.nu.includes(name)),
    ],
    symbols: {},
    decimal: {},
    percent: {},
    currency: {},
    aliases: {},
  }
  const latin = readSystem(resolver, locale, 'latn')
  for (const system of result.nu) {
    const data =
      system === 'latn' || resolver.usesLatinData(locale, system)
        ? latin
        : readSystem(resolver, locale, system)
    if (system !== 'latn' && isEqual(data, latin)) {
      result.aliases![system] = 'latn'
    } else {
      result.symbols[system] = data.symbols
      result.decimal[system] = data.decimal
      result.percent[system] = data.percent
      result.currency[system] = data.currency
    }
  }
  resolver.clearCache()
  return result
}
