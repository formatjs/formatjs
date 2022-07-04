import {supportedValuesOf} from '../polyfills'

describe('Intl.supportedValueOf', () => {
  it('should return supported calendars', () => {
    expect(typeof supportedValuesOf('calendar')).toBe('object')
  })

  it('should throw a range error when given an unsupported key', () => {
    // @ts-expect-error
    expect(() => supportedValuesOf('foo')).toThrowError('Invalid key: foo')
  })
})
