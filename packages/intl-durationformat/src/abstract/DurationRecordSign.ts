import {TABLE_1} from '../constants.js'
import {type DurationRecord} from '../types.js'

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
