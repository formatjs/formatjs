import {Bench} from 'tinybench'
import {match} from '@formatjs/intl-localematcher'

// Benchmark BestFit matcher with all 725 CLDR locales
// This simulates the real-world scenario from issue #4936

// Get all 725 CLDR locales
const cldr = await import('cldr-core/availableLocales.json', {
  with: {type: 'json'},
})
const allLocales: string[] = cldr.default.availableLocales.full

console.log(`Benchmarking with ${allLocales.length} CLDR locales...`)
console.log('Sample locales:', allLocales.slice(0, 10).join(', '))

// Helper function to call BestFit matcher via the public API
function matchLocale(
  requested: string[],
  available: readonly string[]
): string {
  return match(requested, available, 'en', {algorithm: 'best fit'})
}

async function run() {
  const bench = new Bench({time: 1000})

  bench
    // === TIER 1: Exact Match (Fast Path) ===
    .add('Tier 1: BestFit(["en"], 725 locales) - exact match', () => {
      matchLocale(['en'], allLocales)
    })

    .add('Tier 1: BestFit(["fr"], 725 locales) - exact match', () => {
      matchLocale(['fr'], allLocales)
    })

    .add('Tier 1: BestFit(["ja"], 725 locales) - exact match', () => {
      matchLocale(['ja'], allLocales)
    })

    .add('Tier 1: BestFit(["ar"], 725 locales) - exact match', () => {
      matchLocale(['ar'], allLocales)
    })

    // === TIER 2: Maximized Fallback ===
    .add('Tier 2: BestFit(["en-US"], 725 locales) - 1-level fallback', () => {
      matchLocale(['en-US'], allLocales)
    })

    .add('Tier 2: BestFit(["fr-FR"], 725 locales) - 1-level fallback', () => {
      matchLocale(['fr-FR'], allLocales)
    })

    .add(
      'Tier 2: BestFit(["zh-Hans-CN"], 725 locales) - 2-level fallback',
      () => {
        matchLocale(['zh-Hans-CN'], allLocales)
      }
    )

    // === Complex scenario: zh-TW → zh-Hant ===
    .add('Tier 2: BestFit(["zh-TW"], 725 locales) - maximized match', () => {
      matchLocale(['zh-TW'], allLocales)
    })

    .add('Tier 2: BestFit(["zh-HK"], 725 locales) - maximized match', () => {
      matchLocale(['zh-HK'], allLocales)
    })

    .add('Tier 2: BestFit(["zh-MO"], 725 locales) - maximized match', () => {
      matchLocale(['zh-MO'], allLocales)
    })

    // === Complex scenario: sr/sh/bs Serbo-Croatian ===
    .add('Tier 3: BestFit(["sr-Latn"], 725 locales) - CLDR distance', () => {
      matchLocale(['sr-Latn'], allLocales)
    })

    .add('Tier 3: BestFit(["sr-Latn-BA"], 725 locales) - CLDR bs/sh', () => {
      matchLocale(['sr-Latn-BA'], allLocales)
    })

    .add('Tier 3: BestFit(["sh"], 725 locales) - CLDR sr distance', () => {
      matchLocale(['sh'], allLocales)
    })

    // === TIER 3: Fuzzy matching with non-existent locales ===
    .add('Tier 3: BestFit(["en-XZ"], 725 locales) - fuzzy match', () => {
      matchLocale(['en-XZ'], allLocales)
    })

    .add('Tier 3: BestFit(["fr-XX"], 725 locales) - fuzzy match', () => {
      matchLocale(['fr-XX'], allLocales)
    })

    .add('Tier 3: BestFit(["de-XY"], 725 locales) - fuzzy match', () => {
      matchLocale(['de-XY'], allLocales)
    })

    // === Multiple requested locales ===
    .add(
      'Multi: BestFit(["fr", "en"], 725 locales) - multiple requested',
      () => {
        matchLocale(['fr', 'en'], allLocales)
      }
    )

    .add('Multi: BestFit(["de-DE", "fr-FR", "en-US"], 725 locales)', () => {
      matchLocale(['de-DE', 'fr-FR', 'en-US'], allLocales)
    })

    // === Real-world DurationFormat scenario ===
    .add(
      'Real-world: BestFit(["zh-Hans-CN"], 725 locales) - typical mobile',
      () => {
        matchLocale(['zh-Hans-CN'], allLocales)
      }
    )

    .add(
      'Real-world: BestFit(["en-US"], 725 locales) - typical desktop',
      () => {
        matchLocale(['en-US'], allLocales)
      }
    )

  await bench.run()

  console.log('\n=== BestFit Matcher Performance with 725 CLDR Locales ===\n')
  console.table(bench.table())

  console.log('\n=== Performance Analysis ===\n')

  // Extract table data for analysis
  const table = bench.table()

  // Tier 1 examples
  const tier1En = table.find(
    r => r['Task name'] === 'Tier 1: BestFit(["en"], 725 locales) - exact match'
  )

  // Tier 2 examples
  const tier2EnUS = table.find(
    r =>
      r['Task name'] ===
      'Tier 2: BestFit(["en-US"], 725 locales) - 1-level fallback'
  )
  const tier2ZhHansCN = table.find(
    r =>
      r['Task name'] ===
      'Tier 2: BestFit(["zh-Hans-CN"], 725 locales) - 2-level fallback'
  )
  const tier2ZhTW = table.find(
    r =>
      r['Task name'] ===
      'Tier 2: BestFit(["zh-TW"], 725 locales) - maximized match'
  )

  // Tier 3 examples
  const tier3SrLatnBA = table.find(
    r =>
      r['Task name'] ===
      'Tier 3: BestFit(["sr-Latn-BA"], 725 locales) - CLDR bs/sh'
  )
  const tier3EnXZ = table.find(
    r =>
      r['Task name'] === 'Tier 3: BestFit(["en-XZ"], 725 locales) - fuzzy match'
  )

  // Parse latency avg from string like "11967 ± 0.73%"
  const parseLatency = (str: string | number | undefined) => {
    if (!str) return 0
    const strValue = typeof str === 'number' ? str.toString() : str
    const match = strValue.match(/^(\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : 0
  }

  if (
    tier1En &&
    tier2EnUS &&
    tier2ZhHansCN &&
    tier2ZhTW &&
    tier3SrLatnBA &&
    tier3EnXZ
  ) {
    const tier1TimeNs = parseLatency(tier1En['Latency avg (ns)'])
    const tier2EnUSTimeNs = parseLatency(tier2EnUS['Latency avg (ns)'])
    const tier2ZhTWTimeNs = parseLatency(tier2ZhTW['Latency avg (ns)'])
    const tier3SrLatnBATimeNs = parseLatency(tier3SrLatnBA['Latency avg (ns)'])
    const tier3EnXZTimeNs = parseLatency(tier3EnXZ['Latency avg (ns)'])

    console.log('Performance with 725 CLDR locales:')
    console.log('===================================')
    console.log(
      `TIER 1 (Exact "en"):                    ${(tier1TimeNs / 1000).toFixed(2)}μs per match`
    )
    console.log(
      `TIER 2 (Fallback "en-US" → "en"):      ${(tier2EnUSTimeNs / 1000).toFixed(2)}μs per match`
    )
    console.log(
      `TIER 2 (Maximized "zh-TW" → "zh-Hant"): ${(tier2ZhTWTimeNs / 1000).toFixed(2)}μs per match`
    )
    console.log(
      `TIER 3 (CLDR "sr-Latn-BA" → "bs"):     ${(tier3SrLatnBATimeNs / 1000).toFixed(2)}μs per match`
    )
    console.log(
      `TIER 3 (Fuzzy "en-XZ" → "en"):         ${(tier3EnXZTimeNs / 1000).toFixed(2)}μs per match`
    )

    console.log(`\nRelative performance (vs Tier 1):`)
    console.log(
      `   Tier 2 1-level fallback: ${(tier2EnUSTimeNs / tier1TimeNs).toFixed(2)}x slower`
    )
    console.log(
      `   Tier 2 maximized:        ${(tier2ZhTWTimeNs / tier1TimeNs).toFixed(2)}x slower`
    )
    console.log(
      `   Tier 3 CLDR distance:    ${(tier3SrLatnBATimeNs / tier1TimeNs).toFixed(2)}x slower`
    )
    console.log(
      `   Tier 3 fuzzy match:      ${(tier3EnXZTimeNs / tier1TimeNs).toFixed(2)}x slower`
    )

    console.log('\n=== Throughput (matches/second) ===')
    console.log(
      `Tier 1 exact:      ${(1_000_000_000 / tier1TimeNs / 1000).toFixed(0)}K/s`
    )
    console.log(
      `Tier 2 fallback:   ${(1_000_000_000 / tier2EnUSTimeNs / 1000).toFixed(0)}K/s`
    )
    console.log(
      `Tier 2 maximized:  ${(1_000_000_000 / tier2ZhTWTimeNs / 1000).toFixed(0)}K/s`
    )
    console.log(
      `Tier 3 CLDR:       ${(1_000_000_000 / tier3SrLatnBATimeNs / 1000).toFixed(0)}K/s`
    )
    console.log(
      `Tier 3 fuzzy:      ${(1_000_000_000 / tier3EnXZTimeNs / 1000).toFixed(0)}K/s`
    )

    console.log('\n=== Real-world Impact (Issue #4936) ===')
    console.log(
      `Original issue: DurationFormat instantiation took 610ms on React Native/Hermes`
    )
    console.log(`Root cause: Locale matching against 700+ locales was slow`)
    console.log(``)
    console.log(`With this optimization:`)
    console.log(
      `  - Common case (en-US): ${(tier2EnUSTimeNs / 1_000_000).toFixed(3)}ms per instantiation`
    )
    console.log(
      `  - Chinese (zh-TW):     ${(tier2ZhTWTimeNs / 1_000_000).toFixed(3)}ms per instantiation`
    )
    console.log(
      `  - Serbo-Croatian:      ${(tier3SrLatnBATimeNs / 1_000_000).toFixed(3)}ms per instantiation`
    )
    console.log(``)
    console.log(
      `Performance improvement: ${(610 / (tier2EnUSTimeNs / 1_000_000)).toFixed(0)}x faster 🚀`
    )
  }

  // Find zh-TW and sr-Latn-BA results to show what they matched to
  console.log('\n=== Match Results (verification) ===')
  console.log(`zh-TW matched to:      ${matchLocale(['zh-TW'], allLocales)}`)
  console.log(`zh-HK matched to:      ${matchLocale(['zh-HK'], allLocales)}`)
  console.log(
    `sr-Latn-BA matched to: ${matchLocale(['sr-Latn-BA'], allLocales)}`
  )
  console.log(`sh matched to:         ${matchLocale(['sh'], allLocales)}`)
  console.log(`en-XZ matched to:      ${matchLocale(['en-XZ'], allLocales)}`)
}

run()
