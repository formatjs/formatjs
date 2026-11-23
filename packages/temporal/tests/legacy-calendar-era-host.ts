import {Temporal} from '#packages/temporal/index.js'
import {installTemporal} from '#packages/temporal/install.js'
import {
  checkLegacyCalendarEras,
  checkLegacyLunarBoundaries,
} from '#packages/temporal/tests/legacy-calendar-era-oracle.js'
declare function print(value: string): void
const Native = Intl.DateTimeFormat
const nativeParts = Native.prototype.formatToParts
const fixture = (
  globalThis as unknown as {__formatjsArithmeticCalendarOracle: string}
).__formatjsArithmeticCalendarOracle
installTemporal(true)
const count = checkLegacyCalendarEras(Temporal, fixture, Native)
if (count !== 936) throw new Error('Incomplete ICU era selection')
print(`${count} legacy calendar checks from 81 independent ICU rows`)
const boundaries = checkLegacyLunarBoundaries(Temporal, Native, nativeParts)
if (boundaries !== 24) throw new Error('Incomplete lunar boundary selection')
print(`${boundaries} lunar boundary consistency checks`)
