import {GetStringOrBooleanOption} from '../GetStringOrBooleanOption'

describe('GetStringOrBooleanOption', () => {
  test('returns fallback for undefined options', () => {
    const returnedValue = GetStringOrBooleanOption(
      {obj: 1},
      // @ts-expect-error
      'foo',
      ['fooValue'],
      'trueValue',
      'falseValue',
      'fallbackValue'
    )
    expect(returnedValue).toBe('fallbackValue')
  })

  test('returns trueValue for true option', () => {
    const returnedValue = GetStringOrBooleanOption(
      {obj: true, value: 'trueValue'},
      'obj',
      [false, true],
      false,
      true,
      true
    )
    expect(returnedValue).toBe(false)
  })

  test('returns falseValue for falsy option', () => {
    const returnedValue = GetStringOrBooleanOption(
      {obj: '', value: 'trueValue'},
      'obj',
      ['value1'],
      'trueValue',
      'falseValue',
      'fallbackValue'
    )
    expect(returnedValue).toBe('falseValue')
  })

  test('returns fallback for true string option', () => {
    const returnedValue = GetStringOrBooleanOption(
      {obj: 'true', value: 'trueValue'},
      'obj',
      ['true', 'false'],
      'trueValue',
      'falseValue',
      'fallbackValue'
    )
    expect(returnedValue).toBe('fallbackValue')
  })

  test('returns fallback for false string option', () => {
    const returnedValue = GetStringOrBooleanOption(
      {obj: 'false', value: 'trueValue'},
      'obj',
      ['true', 'false'],
      'trueValue',
      'falseValue',
      'fallbackValue'
    )
    expect(returnedValue).toBe('fallbackValue')
  })

  test('throw for value not in range', () => {
    const executeFunction = () =>
      GetStringOrBooleanOption(
        {obj: 'foo', value: 'trueValue'},
        'obj',
        ['a', 'b'],
        'trueValue',
        'falseValue',
        'fallbackValue'
      )
    expect(executeFunction).toThrow('Invalid value foo')
  })

  test('return value', () => {
    const returnValue = GetStringOrBooleanOption(
      {obj: 'b', value: 'trueValue'},
      'obj',
      ['a', 'b'],
      'trueValue',
      'falseValue',
      'fallbackValue'
    )

    expect(returnValue).toBe('b')
  })
})
