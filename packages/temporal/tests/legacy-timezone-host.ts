import {Temporal} from '#packages/temporal/index.js'
import {installTemporal} from '#packages/temporal/install.js'
import {checkLegacyTimezoneVersions} from '#packages/temporal/tests/legacy-timezone-oracle.js'
declare const __temporalTimezoneOracle: string[]
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTimezoneNative: Intl.DateTimeFormatConstructor
  __formatjsTimezoneFaults: () => number
}
for (const installed of [false, true]) {
  if (installed) installTemporal(true)
  const count = checkLegacyTimezoneVersions(
    Temporal,
    __temporalTimezoneOracle.join('\n'),
    host.__formatjsTimezoneNative
  )
  if (count !== 171 || host.__formatjsTimezoneFaults() === 0)
    throw new Error('Incomplete timezone-version locale controls')
  print(`${count} ICU timezone-version locale controls; installed=${installed}`)
}
