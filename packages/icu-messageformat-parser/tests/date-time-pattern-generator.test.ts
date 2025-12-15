import {getBestPattern} from '../date-time-pattern-generator.js'
import {describe, expect, it} from 'vitest'
describe('date-time-pattern-generator', () => {
  // Test most commong 2 patterns
  const testDatah12 = [
    {skeleton: '', expectedTimePattern: ''},

    // h12
    {skeleton: 'j', expectedTimePattern: 'ha'},
    {skeleton: 'jj', expectedTimePattern: 'hha'},
    {skeleton: 'jjj', expectedTimePattern: 'haaaa'},
    {skeleton: 'jjjj', expectedTimePattern: 'hhaaaa'},
    {skeleton: 'jjjjj', expectedTimePattern: 'haaaaa'},
    {skeleton: 'jjjjjj', expectedTimePattern: 'hhaaaaa'},
  ]
  const testDatah23 = [
    // h23
    {skeleton: 'j', expectedTimePattern: 'H'},
    {skeleton: 'jj', expectedTimePattern: 'HH'},
    {skeleton: 'jjj', expectedTimePattern: 'H'},
    {skeleton: 'jjjj', expectedTimePattern: 'HH'},
    {skeleton: 'jjjjj', expectedTimePattern: 'H'},
    {skeleton: 'jjjjjj', expectedTimePattern: 'HH'},
  ]
  describe('when locale has hourCycle', () => {
    it('returns desired time patterns', function () {
      let locale = new Intl.Locale('und', {hourCycle: 'h12'})
      testDatah12.forEach(data => {
        expect(getBestPattern(data.skeleton, locale)).toBe(
          data.expectedTimePattern
        )
      })

      locale = new Intl.Locale('und', {hourCycle: 'h23'})
      testDatah23.forEach(data => {
        expect(getBestPattern(data.skeleton, locale)).toBe(
          data.expectedTimePattern
        )
      })
    })
  })

  describe('when locale has no hourCycle', () => {
    it('returns desired time patterns', function () {
      let locale = new Intl.Locale('en-US')
      testDatah12.forEach(data => {
        expect(getBestPattern(data.skeleton, locale)).toBe(
          data.expectedTimePattern
        )
      })

      locale = new Intl.Locale('de-DE')
      testDatah23.forEach(data => {
        expect(getBestPattern(data.skeleton, locale)).toBe(
          data.expectedTimePattern
        )
      })
    })
  })
})
