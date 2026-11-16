import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {configureSystemClock} from '#packages/temporal/now.js'
import {installTemporal} from '#packages/temporal/install.js'

export function install(native: {
  query: NativeQuery
  epochNanoseconds(): string
  timeZoneId(): string
}): void {
  const {query, epochNanoseconds, timeZoneId} = native
  const toBigInt = BigInt
  configureNativeTemporal(query)
  configureSystemClock({
    epochNanoseconds: () => toBigInt(epochNanoseconds()),
    timeZoneId,
  })
  installTemporal(true)
}
