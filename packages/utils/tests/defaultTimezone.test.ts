import {defaultTimezone} from '../src/defaultTimezone'
import {expect, it, describe} from 'vitest'
describe('defaultTimezone', () => {
  it('returns the default timezone', () => {
    expect(defaultTimezone().length).toBeGreaterThan(0)
  })
  it('should return localized timezone name', () => {
    expect(defaultTimezone('it', {timeZoneName: 'longGeneric'})).toBe('GMT')
  })
  it('should return IANA timezone name if timeZoneName is not specified', () => {
    expect(defaultTimezone('it')).toBe('UTC')
  })
})
