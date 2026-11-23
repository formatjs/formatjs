import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {UTCOffsetNanoseconds} from '#packages/ecma262-abstract/UTCOffsetNanoseconds.js'
import {floor} from '#packages/ecma262-abstract/intrinsics.js'

const apply = Reflect.apply
const toUpperCase = String.prototype.toUpperCase
const stringSlice = String.prototype.slice
const objectKeys = Object.keys
const indexOf = Array.prototype.indexOf

function twoDigits(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

// ECMA-402 §11.1.2 steps 19.d–g and §11.1.3 normalize accepted minute offsets.
// https://tc39.es/ecma402/#sec-formatoffsettimezoneidentifier
// The shared helper also normalizes full ECMA-262 UTC offsets.
function formatOffset(offsetNanoseconds: number): string {
  const sign = offsetNanoseconds < 0 ? '-' : '+'
  const absolute =
    offsetNanoseconds < 0 ? -offsetNanoseconds : offsetNanoseconds
  const minutes = floor(absolute / 60_000_000_000)
  let canonical = `${sign}${twoDigits(floor(minutes / 60))}:${twoDigits(minutes % 60)}`
  const remainder = absolute % 60_000_000_000
  if (remainder) {
    canonical += `:${twoDigits(floor(remainder / 1_000_000_000))}`
    const fraction = remainder % 1_000_000_000
    if (fraction) {
      // Adding one billion supplies leading zeros. Omit the initial 1.
      const digits = `${fraction + 1_000_000_000}`
      let end = digits.length
      while (digits[end - 1] === '0') end--
      canonical += `.${apply(stringSlice, digits, [1, end])}`
    }
  }

  return canonical
}

// ECMA-402 §11.1.2 steps 19–20 normalize offsets or resolve named identifiers.
// https://tc39.es/ecma402/#sec-createdatetimeformat
// For named zones, return the packed data target.
export function CanonicalizeTimeZoneName(
  tz: string,
  {
    zoneNames,
    uppercaseLinks,
  }: {
    zoneNames: readonly string[]
    uppercaseLinks: Record<string, string>
  }
): string | undefined {
  if (tz[0] === '+' || tz[0] === '-') {
    const offset = UTCOffsetNanoseconds(tz)
    return offset === undefined ? undefined : formatOffset(offset)
  }

  // ECMA-402 §6.5.2 step 1.a matches the prepared ASCII identifier.
  // https://tc39.es/ecma402/#sec-getavailablenamedtimezoneidentifier
  const uppercasedTz = apply(toUpperCase, tz, [])
  if (
    uppercasedTz === 'UTC' ||
    uppercasedTz === 'ETC/UTC' ||
    uppercasedTz === 'ETC/GMT'
  )
    return 'UTC'
  let ianaTimeZone = HasOwnProperty(uppercaseLinks, uppercasedTz)
    ? uppercaseLinks[uppercasedTz]
    : undefined
  if (
    ianaTimeZone !== 'Etc/UTC' &&
    ianaTimeZone !== 'Etc/GMT' &&
    (ianaTimeZone === undefined ||
      apply(indexOf, zoneNames, [ianaTimeZone]) < 0)
  ) {
    // Use a packed link's own rows if this pack omitted its canonical target.
    for (let index = zoneNames.length - 1; index >= 0; index--) {
      const zone = zoneNames[index]
      if (apply(toUpperCase, zone, []) !== uppercasedTz) continue
      ianaTimeZone = zone
      break
    }
  }
  if (!ianaTimeZone) {
    const links = objectKeys(uppercaseLinks)
    for (let index = links.length - 1; index >= 0; index--) {
      const zone = uppercaseLinks[links[index]]
      if (apply(toUpperCase, zone, []) !== uppercasedTz) continue
      ianaTimeZone = zone
      break
    }
  }

  // ECMA-402 §6.5.1 step 5.c maps UTC-equivalent primary names to UTC.
  // https://tc39.es/ecma402/#sup-availablenamedtimezoneidentifiers
  if (ianaTimeZone === 'Etc/UTC' || ianaTimeZone === 'Etc/GMT') {
    return 'UTC'
  }

  return ianaTimeZone
}
