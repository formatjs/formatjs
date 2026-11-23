import {TABLE_1} from '#packages/ecma402-abstract/DurationFormat/constants.js'
import {type DurationRecord} from '#packages/ecma402-abstract/types/duration.js'

export function DurationRecordSign(record: DurationRecord): -1 | 0 | 1 {
  // ECMA-402 §13.5.4: use the sign of the first nonzero field.
  // https://tc39.es/ecma402/#sec-durationsign
  for (let index = 0; index < TABLE_1.length; index++) {
    const key = TABLE_1[index]
    if (record[key] < 0) {
      return -1
    }
    if (record[key] > 0) {
      return 1
    }
  }
  return 0
}
