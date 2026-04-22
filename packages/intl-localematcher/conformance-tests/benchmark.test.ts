import {findBestMatch} from '#packages/intl-localematcher/abstract/utils.js'
import {describe, test, expect} from 'vitest'

// Performance regression test — measures wall-clock time for each tier.
// Not a micro-benchmark, but catches order-of-magnitude regressions.

const ITERATIONS = 10_000
const smallSet = ['en', 'es', 'fr', 'de', 'ja', 'zh']
const es419Set = ['en', 'es', 'es-419']

function measure(fn: () => void): number {
  // Warmup
  for (let i = 0; i < 500; i++) fn()

  const start = performance.now()
  for (let i = 0; i < ITERATIONS; i++) fn()
  return (performance.now() - start) / ITERATIONS
}

describe('performance regression check', () => {
  test('Tier 1 (exact match) < 0.01ms', () => {
    const ms = measure(() => findBestMatch(['en'], smallSet))
    console.log(`  Tier 1 exact:        ${(ms * 1000).toFixed(1)}μs`)
    expect(ms).toBeLessThan(0.01)
  })

  test('Tier 2 (fallback en-US) < 0.1ms', () => {
    const ms = measure(() => findBestMatch(['en-US'], smallSet))
    console.log(`  Tier 2 fallback:     ${(ms * 1000).toFixed(1)}μs`)
    expect(ms).toBeLessThan(0.1)
  })

  test('Tier 2 (maximized zh-TW) < 0.1ms', () => {
    const ms = measure(() => findBestMatch(['zh-TW'], ['zh', 'zh-Hant', 'en']))
    console.log(`  Tier 2 maximized:    ${(ms * 1000).toFixed(1)}μs`)
    expect(ms).toBeLessThan(0.1)
  })

  test('Tier 3 (es-MX → es-419) < 0.5ms', () => {
    const ms = measure(() => findBestMatch(['es-MX'], es419Set))
    console.log(`  Tier 3 es-419:       ${(ms * 1000).toFixed(1)}μs`)
    expect(ms).toBeLessThan(0.5)
  })

  test('Tier 3 (sr-Latn-BA) < 0.5ms', () => {
    const ms = measure(() => findBestMatch(['sr-Latn-BA'], ['bs', 'sh', 'en']))
    console.log(`  Tier 3 sr-Latn-BA:   ${(ms * 1000).toFixed(1)}μs`)
    expect(ms).toBeLessThan(0.5)
  })

  test('Tier 3 (fuzzy en-XZ) < 0.5ms', () => {
    const ms = measure(() => findBestMatch(['en-XZ'], smallSet))
    console.log(`  Tier 3 fuzzy:        ${(ms * 1000).toFixed(1)}μs`)
    expect(ms).toBeLessThan(0.5)
  })
})
