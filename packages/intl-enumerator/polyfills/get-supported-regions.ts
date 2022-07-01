import type {Region} from '../data/regions'
import {regions} from '../data/regions'

export function getSupportedRegions(): Region[] {
  const ATOZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const _0TO9 = '0123456789'
  const supportedRegions: Region[] = []

  for (const region of regions) {
    if (region.length === 2 || region.length === 3) {
      supportedRegions.push(region)
    } else if (region.length === 4 && region[2] === '~') {
      const start = ATOZ.indexOf(region[1])
      const end = ATOZ.indexOf(region[3])

      for (let i = start; i <= end; i++) {
        const reg = (region[0] + ATOZ[i]) as Region
        supportedRegions.push(reg)
      }
    } else if (region.length === 5 && region[3] === '~') {
      const start = _0TO9.indexOf(region[2])
      const end = _0TO9.indexOf(region[4])

      for (let i = start; i <= end; i++) {
        const reg = (region.substring(0, 2) + _0TO9[i]) as Region
        supportedRegions.push(reg)
      }
    }
  }

  return supportedRegions
}
