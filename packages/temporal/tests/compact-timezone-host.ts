import {Temporal} from '#packages/temporal/index.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {checkTimezoneOracle} from '#packages/temporal/tests/timezone-oracle.js'

declare const __temporalTimezoneOracle: string[]
declare const __temporalTransitionOracle: string[]
declare const __temporalTimezoneIdentityOracle: string[]
declare function print(value: string): void

if (nativeTemporal()) throw new Error('Expected TypeScript timezone backend')
const counts = checkTimezoneOracle(
  Temporal,
  __temporalTimezoneIdentityOracle.join('\n'),
  __temporalTimezoneOracle.join('\n'),
  __temporalTransitionOracle.join('\n'),
  (actual, expected, context) => {
    if (!Object.is(actual, expected))
      throw new Error(`${context}: ${String(actual)} !== ${String(expected)}`)
  }
)
const expected = {
  identities: 597,
  pairs: 178503,
  offsets: 17640,
  gapsAndFolds: 1900,
  transitions: 14058,
}
if (JSON.stringify(counts) !== JSON.stringify(expected))
  throw new Error(`Incomplete timezone corpus: ${JSON.stringify(counts)}`)
print(JSON.stringify({compactTimezones: counts}))
