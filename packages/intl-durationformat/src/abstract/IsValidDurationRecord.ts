import {invariant} from '@formatjs/ecma402-abstract'
import {TABLE_1} from '../constants.js'
import {DurationRecord} from '../types.js'
import {DurationRecordSign} from './DurationRecordSign.js'

export function IsValidDurationRecord(record: DurationRecord): boolean {
  const sign = DurationRecordSign(record)
  for (const key of TABLE_1) {
    const v = record[key]
    invariant(isFinite(Number(v)), `${key} is not finite`)
    if (v < 0 && sign > 0) {
      return false
    }
    if (v > 0 && sign < 0) {
      return false
    }
  }
  return true
}
