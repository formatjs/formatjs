/**
 * Copyright (c) 2026 Formatjs
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {describe, expect, it} from 'vitest'
import {
  mapWithConcurrencyLimit,
  MAX_CONCURRENT_FILE_READS,
} from '#packages/cli-lib/extract.js'

describe('mapWithConcurrencyLimit', () => {
  it('never exceeds the given concurrency limit and preserves order', async () => {
    const items = Array.from({length: 50}, (_, i) => i)
    let inFlight = 0
    let maxInFlight = 0
    const results = await mapWithConcurrencyLimit(items, 5, async item => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      // Yield so multiple tasks overlap and the bound is actually exercised.
      await new Promise(resolve => setTimeout(resolve, 2))
      inFlight--
      return item * 2
    })

    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
    expect(results.map(r => (r.status === 'fulfilled' ? r.value : -1))).toEqual(
      items.map(i => i * 2)
    )
    expect(maxInFlight).toBeGreaterThan(1)
    expect(maxInFlight).toBeLessThanOrEqual(5)
  })

  it('captures rejections without aborting the remaining tasks', async () => {
    const items = Array.from({length: 10}, (_, i) => i)
    const results = await mapWithConcurrencyLimit(items, 3, async item => {
      if (item === 4) {
        throw new Error(`boom ${item}`)
      }
      return item
    })

    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1)
    expect(results[4].status).toBe('rejected')
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(9)
  })

  it('exposes a positive concurrency limit', () => {
    expect(MAX_CONCURRENT_FILE_READS).toBeGreaterThan(0)
    expect(Number.isInteger(MAX_CONCURRENT_FILE_READS)).toBe(true)
  })
})
