import {supportedValuesOf} from '../polyfills'

describe('Intl.supportedValueOf("calendar")', () => {
  it('should return an array of supported calendars', () => {
    expect(supportedValuesOf('calendar')).toEqual(expect.any(Array))
  })

  it('should throw a range error when given an unsupported or misspelled key', () => {
    // @ts-expect-error
    expect(() => supportedValuesOf('calendars')).toThrowError(
      'Invalid key: calendars'
    )

    // @ts-expect-error
    expect(() => supportedValuesOf('calendarz')).toThrowError(RangeError)
  })
})

describe('Intl.supportedValueOf("collation")', () => {
  it('should return an array of supported collations', () => {
    expect(supportedValuesOf('collation')).toEqual(expect.any(Array))
  })
})

describe('Intl.supportedValueOf("currency")', () => {
  it('should return an array of supported currencies', () => {
    expect(supportedValuesOf('currency')).toEqual(expect.any(Array))
  })
})

describe('Intl.supportedValueOf("numberingSystem")', () => {
  it('should return an array of supported numbering systems', () => {
    expect(supportedValuesOf('numberingSystem')).toEqual(expect.any(Array))
  })
})

describe('Intl.supportedValueOf("timeZone")', () => {
  it('should return an array of supported time zones', () => {
    expect(supportedValuesOf('timeZone')).toEqual(expect.any(Array))
  })
})

describe('Intl.supportedValueOf("unit")', () => {
  it('should return an array of supported units', () => {
    expect(supportedValuesOf('unit')).toEqual(expect.any(Array))
  })
})
