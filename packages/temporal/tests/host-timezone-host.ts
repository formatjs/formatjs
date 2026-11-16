import {createHostTimeZone} from '#packages/temporal/host-timezone.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {timeZoneIdentifier} from '#packages/temporal/zones.js'
import {checkHostTimezoneOracle} from '#packages/temporal/tests/host-timezone-oracle.js'

declare const __temporalTimezoneOracle: string[]
declare const __temporalTimezoneIdentityOracle: string[]
declare function print(value: string): void

if (nativeTemporal()) throw new Error('Expected host Intl timezone offsets')
const counts = checkHostTimezoneOracle(
  id => createHostTimeZone(timeZoneIdentifier(id)),
  __temporalTimezoneIdentityOracle.join('\n'),
  __temporalTimezoneOracle.join('\n'),
  (actual, expected, context) => {
    if (actual !== expected)
      throw new Error(
        `${context}: expected ${String(expected)}, got ${String(actual)}`
      )
  }
)
print(JSON.stringify({hostTimezoneICU: counts}))
