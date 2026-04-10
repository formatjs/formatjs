import {TABLE_1} from '#packages/ecma402-abstract/DurationFormat/constants.js'
import {type DurationRecord} from '#packages/ecma402-abstract/types/duration.js'

export function DurationRecordSign(record: DurationRecord): -1 | 0 | 1 {
  for (const key of TABLE_1) {
    if (record[key] < 0) {
      return -1
    }
    if (record[key] > 0) {
      return 1
    }
  }
  return 0
}
