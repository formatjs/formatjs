import {expect, it} from 'vitest'
import {processZone} from './process-zdump.js'
import {pack} from './packer.js'
import type {UnpackedData} from '../types.js'

it('ignores out-of-range zdump end markers instead of packing NaN as a base-36 transition', () => {
  const data: UnpackedData = {zones: {}, abbrvs: [], offsets: []}
  processZone(
    [
      'zic/Africa/Abidjan  Sun Dec 31 23:59:59 1911 UT = Sun Dec 31 23:43:51 1911 LMT isdst=0 gmtoff=-968',
      'zic/Africa/Abidjan  Mon Jan 1 00:00:00 1912 UT = Mon Jan 1 00:00:00 1912 GMT isdst=0 gmtoff=0',
      'zic/Africa/Abidjan  Thu Dec 31 23:59:59 292277026596 UT = Thu Dec 31 23:59:59 292277026596 GMT isdst=0 gmtoff=0',
    ].join('\n'),
    data
  )
  expect(data.zones['Africa/Abidjan']).toEqual([
    ['', 0, 0, 0],
    [-1830384000, 1, 1, 0],
  ])
  expect(pack(data).zones).toEqual(['Africa/Abidjan|,0,0,0|-u9rhc0,1,1,0'])
})
