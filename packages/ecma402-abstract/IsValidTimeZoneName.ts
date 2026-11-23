import {numberFrom} from '#packages/ecma262-abstract/intrinsics.js'

const apply = Reflect.apply
const regexpExec = RegExp.prototype.exec
const charCodeAt = String.prototype.charCodeAt
const toUpperCase = String.prototype.toUpperCase
const objectKeys = Object.keys

const OFFSET_TIMEZONE_FORMAT_REGEX = /^([+-])(\d{2})(?::?(\d{2}))?$/

/**
 * IsValidDateTimeFormatOffset ( offsetString )
 * ECMA-402 §11.1.2 CreateDateTimeFormat, step 19.c.
 * https://tc39.es/ecma402/#sec-createdatetimeformat
 * https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L94
 *
 * Validates whether a string represents a valid UTC offset timezone.
 * Supports DateTimeFormat offsets: ±HH, ±HHMM, ±HH:MM
 *
 * @param offsetString - The string to validate as a timezone offset
 * @returns true if offsetString is a valid UTC offset format
 */
function IsValidDateTimeFormatOffset(offsetString: string): boolean {
  // CreateDateTimeFormat step 19.c rejects more than one MinuteSecond node:
  // minutes are allowed, but seconds (including :00) are not.
  // ECMA-402 §11.1.2 CreateDateTimeFormat, step 19.c.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L94
  const match = apply(regexpExec, OFFSET_TIMEZONE_FORMAT_REGEX, [offsetString])

  if (!match) {
    return false
  }

  const hours = numberFrom(match[2])
  const minutes = match[3] ? numberFrom(match[3]) : 0

  if (hours > 23 || minutes > 59) {
    return false
  }

  return true
}

/**
 * IsValidTimeZoneName ( timeZone )
 * https://tc39.es/ecma402/#sec-isvalidtimezonename
 *
 * Extended to support UTC offset time zones per ECMA-402 PR #788 (ES2026).
 * The abstract operation validates both:
 * 1. UTC offset identifiers (e.g., "+01:00", "-05:30")
 * 2. Available named time zone identifiers from IANA Time Zone Database
 *
 * @param tz - The timezone identifier to validate
 * @param implDetails - Implementation details containing timezone data
 * @returns true if timeZone is a valid identifier
 */
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
  // 1. If IsValidDateTimeFormatOffset(timeZone) is true, return true
  // Per ECMA-402 PR #788, UTC offset identifiers are valid
  if (IsValidDateTimeFormatOffset(tz)) {
    return true
  }

  // 2. Let timeZones be AvailableNamedTimeZoneIdentifiers()
  // 3. If timeZones contains an element equal to timeZone, return true
  // NOTE: Implementation uses case-insensitive comparison per spec note
  // ECMA-402 §6.5.2 GetAvailableNamedTimeZoneIdentifier, step 1.a:
  // only ASCII case folding is allowed; Unicode lookalikes cannot match IANA names.
  // https://tc39.es/ecma402/#sec-getavailablenamedtimezoneidentifier
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L318
  for (let i = 0; i < tz.length; i++) {
    if (apply(charCodeAt, tz, [i]) > 0x7f) return false
  }
  const uppercasedTz = apply(toUpperCase, tz, [])
  for (let index = 0; index < zoneNamesFromData.length; index++) {
    if (apply(toUpperCase, zoneNamesFromData[index], []) === uppercasedTz)
      return true
  }
  const links = objectKeys(uppercaseLinks)
  for (let index = 0; index < links.length; index++) {
    const link = links[index]
    if (
      apply(toUpperCase, link, []) === uppercasedTz ||
      apply(toUpperCase, uppercaseLinks[link], []) === uppercasedTz
    )
      return true
  }

  // 4. Return false
  return false
}
