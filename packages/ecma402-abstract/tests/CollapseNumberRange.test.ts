import {CollapseNumberRange} from '#packages/ecma402-abstract/NumberFormat/CollapseNumberRange.js'
import type {NumberFormatPart} from '#packages/ecma402-abstract/types/number.js'
import {getInternalSlots} from '#packages/ecma402-abstract/tests/utils.js'
import {describe, expect, test} from 'vitest'

const numberFormat = new Intl.NumberFormat('it')

function collapse(start: NumberFormatPart[], end: NumberFormatPart[]) {
  // PartitionNumberRangePattern assigns endpoint sources before collapsing.
  // ECMA-402 §16.5.19 steps 6–9; only the separator starts as shared.
  // https://tc39.es/ecma402/#sec-partitionnumberrangepattern
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1836-L1841
  return CollapseNumberRange(
    numberFormat,
    [
      ...start.map(part => ({...part, source: 'startRange' as const})),
      {type: 'literal', value: '-', source: 'shared'},
      ...end.map(part => ({...part, source: 'endRange' as const})),
    ],
    {getInternalSlots}
  )
}

function currencyAmount(integer: string, currency = '€'): NumberFormatPart[] {
  return [
    {type: 'integer', value: integer},
    {type: 'literal', value: ' '},
    {type: 'currency', value: currency},
  ]
}

function negativeMillions(integer: string): NumberFormatPart[] {
  return [
    {type: 'minusSign', value: '-'},
    {type: 'integer', value: integer},
    {type: 'group', value: '.'},
    {type: 'integer', value: '000'},
    {type: 'group', value: '.'},
    {type: 'integer', value: '000'},
    {type: 'decimal', value: ','},
    {type: 'fraction', value: '00'},
    {type: 'literal', value: ' '},
    {type: 'currency', value: '€'},
  ]
}

describe('CollapseNumberRange', () => {
  test('collapses matching currency suffixes with valid endpoint sources', () => {
    const parts = collapse(negativeMillions('1'), negativeMillions('2'))
    expect(parts.map(part => part.value).join('')).toBe(
      '-1.000.000,00 - -2.000.000,00 €'
    )
    expect(parts[parts.length - 1]).toEqual({
      type: 'currency',
      value: '€',
      source: 'shared',
    })
    expect(
      collapse(currencyAmount('10'), currencyAmount('100'))
        .map(part => part.value)
        .join('')
    ).toBe('10-100 €')
  })

  test('keeps different currency affixes on their endpoints', () => {
    const parts = collapse(currencyAmount('10'), currencyAmount('100', '$'))
    expect(parts.map(part => part.value).join('')).toBe('10 € - 100 $')
    expect(
      parts.filter(part => part.type === 'currency').map(part => part.source)
    ).toEqual(['startRange', 'endRange'])
  })
})
