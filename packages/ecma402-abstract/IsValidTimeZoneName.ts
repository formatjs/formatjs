import {UTCOffsetNanoseconds} from '#packages/ecma262-abstract/UTCOffsetNanoseconds.js'

const apply = Reflect.apply
const charCodeAt = String.prototype.charCodeAt
const toUpperCase = String.prototype.toUpperCase
const hasOwnProperty = Object.prototype.hasOwnProperty

// ECMA-402 §11.1.2 steps 19–20 accept a minute offset or available named zone.
// https://tc39.es/ecma402/#sec-createdatetimeformat
export function IsValidTimeZoneName(
  tz: string,
  {
    zoneNamesFromData,
    uppercaseLinks,
  }: {
    zoneNamesFromData: readonly string[]
    uppercaseLinks: Record<string, string>
  }
): boolean {
  // §6.5.2 step 2 returns empty for an empty identifier.
  if (tz.length === 0) return false
  if (tz[0] === '+' || tz[0] === '-') {
    // Step 19.c limits DateTimeFormat identifiers to minute precision.
    // https://tc39.es/ecma262/#sec-time-zone-offset-strings
    return UTCOffsetNanoseconds(tz, true) !== undefined
  }

  // ECMA-402 §6.5.1 sources available identifiers from IANA zones and links.
  // https://tc39.es/ecma402/#sup-availablenamedtimezoneidentifiers
  // ECMA-402 §6.5.2 GetAvailableNamedTimeZoneIdentifier, step 1.a:
  // only ASCII case folding is allowed; Unicode lookalikes cannot match IANA names.
  // https://tc39.es/ecma402/#sec-getavailablenamedtimezoneidentifier
  // https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
  for (let i = 0; i < tz.length; i++) {
    if (apply(charCodeAt, tz, [i]) > 0x7f) return false
  }
  const uppercasedTz = apply(toUpperCase, tz, [])
  if (
    uppercasedTz === 'UTC' ||
    uppercasedTz === 'ETC/UTC' ||
    uppercasedTz === 'ETC/GMT'
  )
    return true
  if (apply(hasOwnProperty, uppercaseLinks, [uppercasedTz])) {
    const target = uppercaseLinks[uppercasedTz]
    if (target === 'Etc/UTC' || target === 'Etc/GMT' || target === 'UTC')
      return true
    // A pack can include either the IANA link's target or the link's own rows.
    for (let zone = 0; zone < zoneNamesFromData.length; zone++) {
      if (zoneNamesFromData[zone] === target) return true
    }
  }
  for (let index = 0; index < zoneNamesFromData.length; index++) {
    if (apply(toUpperCase, zoneNamesFromData[index], []) === uppercasedTz)
      return true
  }

  // ECMA-402 §6.5.2 step 2 returns empty after an unsuccessful lookup.
  return false
}
