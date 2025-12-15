import {describe, expect, it} from 'vitest'
import {DayFromYear} from '../262.js'

describe('262', () => {
  describe('DayFromYear', () => {
    it('calculates correct day number for year 1 AD', () => {
      expect(DayFromYear(1)).toBe(-719162)
    })

    it('calculates correct day number for year 1970 (Unix epoch)', () => {
      expect(DayFromYear(1970)).toBe(0)
    })

    it('calculates correct day number for year 2000', () => {
      expect(DayFromYear(2000)).toBe(10957)
    })
  })
})
