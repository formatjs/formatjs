import {IsValidDateTimeFieldCode} from '../abstract/IsValidDateTimeFieldCode'

describe('IsValidDateTimeFieldCode', () => {
  const validCodesForDateTimeFields = [
    'era',
    'year',
    'quarter',
    'month',
    'weekOfYear',
    'weekday',
    'day',
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'timeZoneName',
  ]

  validCodesForDateTimeFields.forEach(validCode => {
    it(`returns true if code is "${validCode}"`, () => {
      expect(IsValidDateTimeFieldCode(validCode)).toBe(true)
    })
  })

  it('returns false for any other code', () => {
    expect(IsValidDateTimeFieldCode('invalid_code')).toBe(false)
  })
})
