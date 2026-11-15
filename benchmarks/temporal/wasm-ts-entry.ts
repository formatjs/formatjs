import {parseInstantString} from '#packages/temporal/instant-string.js'
import {formatInstant} from '#packages/temporal/instant-format.js'
import {roundInstantOptions} from '#packages/temporal/rounding.js'
import {Duration} from '#packages/temporal/duration.js'

export function run(operation: number, input: string): string | number {
  switch (operation) {
    case 0:
      return parseInstantString(input).toString()
    case 1:
      return roundInstantOptions(
        parseInstantString(input),
        'microsecond'
      ).toString()
    case 2:
      return formatInstant(parseInstantString(input))
    case 3:
      return Duration.from(input).toJSON()
    case 4:
      return Duration.from(input).total('microsecond')
    default:
      throw new RangeError('Unknown operation')
  }
}
