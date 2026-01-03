import {SetNumberFormatDigitOptions} from '../NumberFormat/SetNumberFormatDigitOptions.js'
import {
  type NumberFormatDigitInternalSlots,
  type NumberFormatDigitOptions,
} from '../types/number.js'
import {describe, expect, it, beforeEach} from 'vitest'
describe('SetNumberFormatDigitOptions', () => {
  let internalSlots: NumberFormatDigitInternalSlots

  beforeEach(() => {
    internalSlots = {} as NumberFormatDigitInternalSlots
  })

  it('should set default values when options are not provided', () => {
    const opts: NumberFormatDigitOptions = {}
    SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
    expect(internalSlots).toEqual({
      maximumFractionDigits: 3,
      minimumFractionDigits: 0,
      minimumIntegerDigits: 1,
      roundingIncrement: 1,
      roundingMode: 'halfExpand',
      roundingPriority: 'auto',
      roundingType: 'fractionDigits',
      trailingZeroDisplay: 'auto',
    })
  })

  it('should set provided minimum and maximum fraction digits', () => {
    const opts: NumberFormatDigitOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }
    SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
    expect(internalSlots.minimumFractionDigits).toBe(2)
    expect(internalSlots.maximumFractionDigits).toBe(4)
  })

  it('should throw error if minimumFractionDigits is greater than maximumFractionDigits', () => {
    const opts: NumberFormatDigitOptions = {
      minimumFractionDigits: 5,
      maximumFractionDigits: 3,
    }
    expect(() =>
      SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
    ).toThrow(RangeError)
  })

  it('should set significant digits when provided', () => {
    const opts: NumberFormatDigitOptions = {
      minimumSignificantDigits: 2,
      maximumSignificantDigits: 5,
    }
    SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
    expect(internalSlots.minimumSignificantDigits).toBe(2)
    expect(internalSlots.maximumSignificantDigits).toBe(5)
  })

  it('should set roundingIncrement and validate it', () => {
    const opts: NumberFormatDigitOptions = {
      roundingIncrement: 5,
    }
    SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
    expect(internalSlots.roundingIncrement).toBe(5)
  })

  it('should throw error for invalid roundingIncrement', () => {
    const opts: NumberFormatDigitOptions = {
      roundingIncrement: 3,
    }
    expect(() =>
      SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
    ).toThrow(Error)
  })

  it('should set roundingMode and trailingZeroDisplay', () => {
    const opts: NumberFormatDigitOptions = {
      roundingMode: 'floor',
      trailingZeroDisplay: 'stripIfInteger',
    }
    SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
    expect(internalSlots.roundingMode).toBe('floor')
    expect(internalSlots.trailingZeroDisplay).toBe('stripIfInteger')
  })

  it('should set roundingType and roundingPriority based on roundingPriority option', () => {
    const opts: NumberFormatDigitOptions = {
      roundingPriority: 'morePrecision',
    }
    SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
    expect(internalSlots.roundingType).toBe('morePrecision')
    expect(internalSlots.roundingPriority).toBe('morePrecision')
  })

  it('standard 2/2 (currency) notation', () => {
    SetNumberFormatDigitOptions(internalSlots, {}, 2, 2, 'standard')
    expect(internalSlots).toEqual({
      minimumIntegerDigits: 1,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      roundingIncrement: 1,
      roundingMode: 'halfExpand',
      roundingPriority: 'auto',
      roundingType: 'fractionDigits',
      trailingZeroDisplay: 'auto',
    })
  })

  it('compact notation', () => {
    SetNumberFormatDigitOptions(internalSlots, {}, 0, 3, 'compact')
    expect(internalSlots).toEqual({
      minimumIntegerDigits: 1,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      minimumSignificantDigits: 1,
      maximumSignificantDigits: 2,
      roundingIncrement: 1,
      roundingMode: 'halfExpand',
      roundingPriority: 'morePrecision',
      roundingType: 'morePrecision',
      trailingZeroDisplay: 'auto',
    })
  })

  it('scientific notation', () => {
    SetNumberFormatDigitOptions(internalSlots, {}, 0, 3, 'scientific')
    expect(internalSlots).toEqual({
      minimumIntegerDigits: 1,
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
      roundingIncrement: 1,
      roundingMode: 'halfExpand',
      roundingPriority: 'auto',
      roundingType: 'fractionDigits',
      trailingZeroDisplay: 'auto',
    })
  })
})
