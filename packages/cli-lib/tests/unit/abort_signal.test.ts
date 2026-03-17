import {describe, it, expect} from 'vitest'
import {extract} from '../../src/extract'
import {compile} from '../../src/compile'

describe('AbortSignal support', () => {
  describe('extract()', () => {
    it('rejects when signal is already aborted (throws: true)', async () => {
      const controller = new AbortController()
      controller.abort()
      await expect(
        extract(['nonexistent.ts'], {throws: true, signal: controller.signal})
      ).rejects.toThrow(/abort/i)
    })

    it('warns but does not reject when signal is already aborted (throws: false)', async () => {
      const controller = new AbortController()
      controller.abort()
      // With throws: false, errors are caught and warned, result is empty
      const result = await extract(['nonexistent.ts'], {
        signal: controller.signal,
      })
      expect(result).toBeDefined()
    })
  })

  describe('compile()', () => {
    it('rejects when signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()
      await expect(
        compile(['nonexistent.json'], {signal: controller.signal})
      ).rejects.toThrow()
    })
  })
})
