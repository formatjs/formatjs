import {CollapseNumberRange} from '../NumberFormat/CollapseNumberRange.js'
import {getInternalSlots} from './utils.js'
import {describe, expect, test} from 'vitest'
const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

describe('CollapseNumberRange', () => {
  test('returns the same result', () => {
    expect(
      CollapseNumberRange(
        numberFormat,
        [
          {
            type: 'minusSign',
            value: '-',
            source: 'shared',
          },
          {
            type: 'integer',
            value: '1',
            source: 'startRange',
          },
          {
            type: 'group',
            value: '.',
            source: 'startRange',
          },
          {
            type: 'integer',
            value: '000',
            source: 'startRange',
          },
          {
            type: 'group',
            value: '.',
            source: 'startRange',
          },
          {
            type: 'integer',
            value: '000',
            source: 'startRange',
          },
          {
            type: 'decimal',
            value: ',',
            source: 'startRange',
          },
          {
            type: 'fraction',
            value: '00',
            source: 'startRange',
          },
          {
            type: 'literal',
            value: ' ',
            source: 'shared',
          },
          {
            type: 'currency',
            value: '€',
            source: 'shared',
          },
          {
            type: 'literal',
            value: '-',
            source: 'shared',
          },
          {
            type: 'minusSign',
            value: '-',
            source: 'shared',
          },
          {
            type: 'integer',
            value: '2',
            source: 'endRange',
          },
          {
            type: 'group',
            value: '.',
            source: 'endRange',
          },
          {
            type: 'integer',
            value: '000',
            source: 'endRange',
          },
          {
            type: 'group',
            value: '.',
            source: 'endRange',
          },
          {
            type: 'integer',
            value: '000',
            source: 'endRange',
          },
          {
            type: 'decimal',
            value: ',',
            source: 'endRange',
          },
          {
            type: 'fraction',
            value: '00',
            source: 'endRange',
          },
          {
            type: 'literal',
            value: ' ',
            source: 'shared',
          },
          {
            type: 'currency',
            value: '€',
            source: 'shared',
          },
        ],
        {
          getInternalSlots,
        }
      )
        .map(p => p.value)
        .join('')
    ).toBe('-1.000.000,00--2.000.000,00 €')
    expect(
      CollapseNumberRange(
        numberFormat,
        [
          {
            type: 'integer',
            value: '10',
            source: 'startRange',
          },
          {
            type: 'literal',
            value: ' ',
            source: 'shared',
          },
          {
            type: 'currency',
            value: '€',
            source: 'shared',
          },
          {
            type: 'literal',
            value: '-',
            source: 'shared',
          },
          {
            type: 'integer',
            value: '100',
            source: 'endRange',
          },
          {
            type: 'literal',
            value: ' ',
            source: 'shared',
          },
          {
            type: 'currency',
            value: '€',
            source: 'shared',
          },
        ],
        {
          getInternalSlots,
        }
      )
        .map(p => p.value)
        .join('')
    ).toBe('10-100 €')
  })
})
