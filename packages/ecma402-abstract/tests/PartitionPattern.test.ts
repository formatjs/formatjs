import {PartitionPattern} from '../PartitionPattern'
import {expect, test} from 'vitest'
test('PartitionPattern should partition pattern correctly', function () {
  expect(PartitionPattern('AA{0}BB')).toEqual([
    {
      type: 'literal',
      value: 'AA',
    },
    {
      type: '0',
      value: undefined,
    },
    {
      type: 'literal',
      value: 'BB',
    },
  ])
  expect(PartitionPattern('{0} BB')).toEqual([
    {
      type: '0',
      value: undefined,
    },
    {
      type: 'literal',
      value: ' BB',
    },
  ])
  expect(PartitionPattern('AA {0}')).toEqual([
    {
      type: 'literal',
      value: 'AA ',
    },
    {
      type: '0',
      value: undefined,
    },
  ])
})
