import {_resetDefaultTimezone, defaultTimezone} from '../src/defaultTimezone'

describe('defaultTimezone', () => {
  beforeEach(() => {
    _resetDefaultTimezone()
  })
  it('returns the default timezone', () => {
    expect(defaultTimezone().length).toBeGreaterThan(0)
  })
  it('should not throw', () => {
    expect(
      defaultTimezone(() => {
        throw new Error()
      })
    ).toBe('UTC')
  })
  it('should prioritize default platform timezone', () => {
    const spyFn = jest.fn(() => {
      return {
        resolvedOptions() {
          return {
            timeZone: 'blah',
          }
        },
      }
    })
    expect(defaultTimezone(spyFn as any)).toBe('blah')
  })
})
