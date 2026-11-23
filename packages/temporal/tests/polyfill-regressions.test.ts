import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'

const fixture = runfiles.resolve(
  `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/temporal/polyfill-regressions.tsv`
)
const cases = readFileSync(fixture, 'utf8')
  .trim()
  .split('\n')
  .filter(line => line && !line.startsWith('#'))

it.each(cases)('%s', line => {
  const [operation, input, second, smallestUnit, roundingMode, expected] =
    line.split('\t')
  switch (operation) {
    case 'duration-string':
      expect(
        Temporal.Duration.from({[input]: Number(second)}).toString({
          smallestUnit,
          roundingMode,
        })
      ).toBe(expected)
      break
    case 'zoned-until':
    case 'zoned-since': {
      const start = Temporal.ZonedDateTime.from(input)
      const end = Temporal.ZonedDateTime.from(second)
      const options = {largestUnit: 'day', smallestUnit, roundingMode}
      const difference =
        operation === 'zoned-until'
          ? start.until(end, options)
          : start.since(end, options)
      expect(difference.toString()).toBe(expected)
      break
    }
    case 'epoch-milliseconds':
      expect(new Temporal.Instant(BigInt(input)).epochMilliseconds).toBe(
        Number(second)
      )
      break
    case 'instant-parse':
      expect(Temporal.Instant.from(input).epochNanoseconds).toBe(BigInt(second))
      break
    default:
      throw new Error(`Unknown Temporal fixture operation ${operation}`)
  }
})
