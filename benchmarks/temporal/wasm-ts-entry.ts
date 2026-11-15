import {parseInstantString} from '#packages/temporal/instant-string.js'
import {formatInstant} from '#packages/temporal/instant-format.js'
import {roundInstantOptions} from '#packages/temporal/rounding.js'
import {formatDuration} from '#packages/temporal/duration-format.js'
import {
  parseDurationString,
  durationNanoseconds,
  durationTotalNumber,
} from '#packages/temporal/duration-core.js'

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
      return formatDuration(parseDurationString(input))
    case 4: {
      const fields = parseDurationString(input)
      if (fields.years || fields.months || fields.weeks)
        throw new RangeError('Calendar total requires relativeTo')
      return durationTotalNumber(durationNanoseconds(fields), 1000n)
    }
    default:
      throw new RangeError('Unknown operation')
  }
}
