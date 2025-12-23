import {Bench} from 'tinybench'
import {DurationFormat} from '@formatjs/intl-durationformat'

// Test instantiation performance - the issue reported in #4936
// Creating DurationFormat instances was taking 610ms on React Native/Hermes
// due to 700+ locales being auto-loaded and slow locale matching

async function run() {
  const bench = new Bench({time: 1000})

  bench
    // Test instantiation with exact locale match (should be fast with optimization)
    .add('new DurationFormat("en")', () => {
      new DurationFormat('en')
    })

    // Test with common locales
    .add('new DurationFormat("en-US")', () => {
      new DurationFormat('en-US')
    })

    .add('new DurationFormat("ja")', () => {
      new DurationFormat('ja')
    })

    .add('new DurationFormat("fr")', () => {
      new DurationFormat('fr')
    })

    // Test fallback path with multi-level subtag removal
    .add('new DurationFormat("zh-Hans-CN") [fallback: zh-Hans]', () => {
      new DurationFormat('zh-Hans-CN')
    })

    .add('new DurationFormat("en-US-x-custom") [fallback: en-US → en]', () => {
      new DurationFormat('en-US-x-custom')
    })

    // Test with fuzzy matching (locale not in available set)
    .add('new DurationFormat("en-XZ") [fuzzy match]', () => {
      new DurationFormat('en-XZ')
    })

    // Test with options (still needs locale resolution)
    .add('new DurationFormat("en", {style: "digital"})', () => {
      new DurationFormat('en', {style: 'digital'})
    })

    // Test with multiple requested locales
    .add('new DurationFormat(["fr", "en"])', () => {
      new DurationFormat(['fr', 'en'])
    })

    // Test with lookup matcher (different algorithm)
    .add('new DurationFormat("en", {localeMatcher: "lookup"})', () => {
      new DurationFormat('en', {localeMatcher: 'lookup'})
    })

    // Test with best fit matcher (default)
    .add('new DurationFormat("en", {localeMatcher: "best fit"})', () => {
      new DurationFormat('en', {localeMatcher: 'best fit'})
    })

  await bench.run()

  console.log('\n=== DurationFormat Instantiation Performance ===\n')
  console.table(bench.table())

  console.log('\n=== Performance Analysis ===\n')

  // Extract table data for analysis
  const table = bench.table()
  const enRow = table.find(r => r['Task name'] === 'new DurationFormat("en")')
  const enUSRow = table.find(
    r => r['Task name'] === 'new DurationFormat("en-US")'
  )
  const zhHansCNRow = table.find(
    r =>
      r['Task name'] === 'new DurationFormat("zh-Hans-CN") [fallback: zh-Hans]'
  )
  const fuzzyRow = table.find(
    r => r['Task name'] === 'new DurationFormat("en-XZ") [fuzzy match]'
  )

  if (enRow && enUSRow && zhHansCNRow && fuzzyRow) {
    // Parse latency avg from string like "11967 ± 0.73%"
    const parseLatency = (str: string) => {
      const match = str.match(/^(\d+(?:\.\d+)?)/)
      return match ? parseFloat(match[1]) : 0
    }

    const enTimeMs = parseLatency(enRow['Latency avg (ns)']) / 1_000
    const enUSTimeMs = parseLatency(enUSRow['Latency avg (ns)']) / 1_000
    const zhHansCNTimeMs = parseLatency(zhHansCNRow['Latency avg (ns)']) / 1_000
    const fuzzyTimeMs = parseLatency(fuzzyRow['Latency avg (ns)']) / 1_000

    console.log(
      `TIER 1 (Exact match) "en":           ${enTimeMs.toFixed(3)}ms per instantiation`
    )
    console.log(
      `TIER 2 (Fallback 1-level) "en-US":   ${enUSTimeMs.toFixed(3)}ms per instantiation`
    )
    console.log(
      `TIER 2 (Fallback 2-level) "zh-Hans-CN": ${zhHansCNTimeMs.toFixed(3)}ms per instantiation`
    )
    console.log(
      `TIER 3 (Fuzzy match) "en-XZ":        ${fuzzyTimeMs.toFixed(3)}ms per instantiation`
    )
    console.log(`\nRelative performance (vs Tier 1):`)
    console.log(
      `   Tier 2 1-level fallback: ${(enUSTimeMs / enTimeMs).toFixed(2)}x slower`
    )
    console.log(
      `   Tier 2 2-level fallback: ${(zhHansCNTimeMs / enTimeMs).toFixed(2)}x slower`
    )
    console.log(
      `   Tier 3 fuzzy match:      ${(fuzzyTimeMs / enTimeMs).toFixed(2)}x slower`
    )

    // Compare to the issue #4936 baseline (610ms on React Native/Hermes)
    console.log(`\n⚡ Improvement vs React Native baseline (610ms):`)
    console.log(
      `   Tier 1 exact:     ${(610 / enTimeMs).toFixed(0)}x faster (from 610ms to ${enTimeMs.toFixed(1)}ms)`
    )
    console.log(
      `   Tier 2 fallback:  ${(610 / enUSTimeMs).toFixed(0)}x faster (from 610ms to ${enUSTimeMs.toFixed(1)}ms)`
    )
    console.log(
      `   Tier 3 fuzzy:     ${(610 / fuzzyTimeMs).toFixed(0)}x faster (from 610ms to ${fuzzyTimeMs.toFixed(1)}ms)`
    )
  }

  console.log('\n=== Available Locales Info ===')
  console.log(
    `Total available locales: ${DurationFormat.availableLocales.size}`
  )
  console.log(
    `This is the root cause of #4936 - locale matching against 700+ locales`
  )
}

run()
