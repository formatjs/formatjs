import {Bench} from 'tinybench'
import {findBestMatch} from '../abstract/utils.js'

// Test locale matching performance - the optimization for issue #4936
// The issue reported DurationFormat instantiation taking 610ms on React Native/Hermes
// due to 700+ locales being auto-loaded and slow locale matching

async function run() {
  const bench = new Bench({time: 1000})

  // Create a large set of locales to simulate real-world scenario
  const manyLocales = [
    'af',
    'ar',
    'be',
    'bg',
    'ca',
    'cs',
    'cy',
    'da',
    'de',
    'el',
    'en',
    'es',
    'et',
    'eu',
    'fa',
    'fi',
    'fr',
    'ga',
    'gl',
    'gu',
    'he',
    'hi',
    'hr',
    'hu',
    'id',
    'is',
    'it',
    'ja',
    'ka',
    'kk',
    'km',
    'kn',
    'ko',
    'ky',
    'lt',
    'lv',
    'mk',
    'ml',
    'mn',
    'mr',
    'ms',
    'nb',
    'ne',
    'nl',
    'nn',
    'no',
    'pa',
    'pl',
    'pt',
    'ro',
    'ru',
    'si',
    'sk',
    'sl',
    'sq',
    'sr',
    'sv',
    'sw',
    'ta',
    'te',
    'th',
    'tr',
    'uk',
    'ur',
    'uz',
    'vi',
    'zh',
  ]

  bench
    // === TIER 1: Exact Match (Fast Path) ===
    .add('Tier 1: findBestMatch(["en"], 70 locales) - exact match', () => {
      findBestMatch(['en'], manyLocales)
    })

    .add('Tier 1: findBestMatch(["fr"], 70 locales) - exact match', () => {
      findBestMatch(['fr'], manyLocales)
    })

    // === TIER 2: Maximized Fallback ===
    .add('Tier 2: findBestMatch(["en-US"], 70 locales) - fallback', () => {
      findBestMatch(['en-US'], manyLocales)
    })

    .add(
      'Tier 2: findBestMatch(["zh-TW"], ["zh-Hant", ...]) - maximized',
      () => {
        findBestMatch(['zh-TW'], ['zh-Hant', 'en', 'fr'])
      }
    )

    .add(
      'Tier 2: findBestMatch(["zh-Hans-CN"], 70 locales) - 2-level fallback',
      () => {
        findBestMatch(['zh-Hans-CN'], [...manyLocales, 'zh-Hans'])
      }
    )

    // === TIER 3: Full UTS #35 Distance Calculation ===
    .add('Tier 3: findBestMatch(["en-XZ"], 70 locales) - fuzzy match', () => {
      findBestMatch(['en-XZ'], manyLocales)
    })

    .add('Tier 3: findBestMatch(["sr-Latn-BA"], ["bs", "sh"]) - CLDR', () => {
      findBestMatch(['sr-Latn-BA'], ['bs', 'sh'])
    })

    // === Multiple Requested Locales ===
    .add('findBestMatch(["fr", "en"], 70 locales) - multiple requested', () => {
      findBestMatch(['fr', 'en'], manyLocales)
    })

    .add(
      'findBestMatch(["de-DE", "fr-FR"], 70 locales) - multiple with fallback',
      () => {
        findBestMatch(['de-DE', 'fr-FR'], ['en', 'en-US', 'fr-FR'])
      }
    )

    // === Canonicalization ===
    .add('Canonicalization: findBestMatch(["zh-HK"], ["zh-HANT", ...])', () => {
      findBestMatch(['zh-HK'], ['zh', 'zh-HANT', 'en'])
    })

  await bench.run()

  console.log('\n=== Locale Matching Performance (Issue #4936) ===\n')
  console.table(bench.table())

  console.log('\n=== Performance Analysis ===\n')

  // Extract table data for analysis
  const table = bench.table()
  const tier1ExactEn = table.find(
    r =>
      r['Task name'] ===
      'Tier 1: findBestMatch(["en"], 70 locales) - exact match'
  )
  const tier2FallbackEnUS = table.find(
    r =>
      r['Task name'] ===
      'Tier 2: findBestMatch(["en-US"], 70 locales) - fallback'
  )
  const tier2Fallback2Level = table.find(
    r =>
      r['Task name'] ===
      'Tier 2: findBestMatch(["zh-Hans-CN"], 70 locales) - 2-level fallback'
  )
  const tier3FuzzyMatch = table.find(
    r =>
      r['Task name'] ===
      'Tier 3: findBestMatch(["en-XZ"], 70 locales) - fuzzy match'
  )

  if (
    tier1ExactEn &&
    tier2FallbackEnUS &&
    tier2Fallback2Level &&
    tier3FuzzyMatch
  ) {
    // Parse latency avg from string like "11967 ± 0.73%"
    const parseLatency = (str: string) => {
      const match = str.match(/^(\d+(?:\.\d+)?)/)
      return match ? parseFloat(match[1]) : 0
    }

    const tier1TimeNs = parseLatency(tier1ExactEn['Latency avg (ns)'])
    const tier2TimeNs = parseLatency(tier2FallbackEnUS['Latency avg (ns)'])
    const tier2_2LevelTimeNs = parseLatency(
      tier2Fallback2Level['Latency avg (ns)']
    )
    const tier3TimeNs = parseLatency(tier3FuzzyMatch['Latency avg (ns)'])

    console.log(
      `TIER 1 (Exact match):        ${tier1TimeNs.toFixed(0)}ns per match`
    )
    console.log(
      `TIER 2 (Fallback 1-level):   ${tier2TimeNs.toFixed(0)}ns per match`
    )
    console.log(
      `TIER 2 (Fallback 2-level):   ${tier2_2LevelTimeNs.toFixed(0)}ns per match`
    )
    console.log(
      `TIER 3 (Fuzzy match):        ${tier3TimeNs.toFixed(0)}ns per match`
    )
    console.log(`\nRelative performance (vs Tier 1):`)
    console.log(
      `   Tier 2 1-level fallback: ${(tier2TimeNs / tier1TimeNs).toFixed(2)}x slower`
    )
    console.log(
      `   Tier 2 2-level fallback: ${(tier2_2LevelTimeNs / tier1TimeNs).toFixed(2)}x slower`
    )
    console.log(
      `   Tier 3 fuzzy match:      ${(tier3TimeNs / tier1TimeNs).toFixed(2)}x slower`
    )

    console.log('\n=== Throughput ===')
    console.log(
      `Tier 1: ${((1_000_000_000 / tier1TimeNs) * 1000).toFixed(0)} matches/second`
    )
    console.log(
      `Tier 2: ${((1_000_000_000 / tier2TimeNs) * 1000).toFixed(0)} matches/second`
    )
    console.log(
      `Tier 3: ${((1_000_000_000 / tier3TimeNs) * 1000).toFixed(0)} matches/second`
    )
  }
}

run()
