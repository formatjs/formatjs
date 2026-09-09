// Cached regex patterns for performance
const OFFSET_TIMEZONE_PREFIX_REGEX = /^[+-]/
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
  if (!OFFSET_TIMEZONE_PREFIX_REGEX.test(offsetString)) {
    return false
  }

  // CreateDateTimeFormat step 19.c rejects more than one MinuteSecond node:
  // minutes are allowed, but seconds (including :00) are not.
  // ECMA-402 §11.1.2 CreateDateTimeFormat, step 19.c.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L94
  const match = OFFSET_TIMEZONE_FORMAT_REGEX.exec(offsetString)

  if (!match) {
    return false
  }

  const hours = parseInt(match[2], 10)
  const minutes = match[3] ? parseInt(match[3], 10) : 0

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
    if (tz.charCodeAt(i) > 0x7f) return false
  }
  const uppercasedTz = tz.toUpperCase()
  const zoneNames = new Set()
  const linkNames = new Set()

  zoneNamesFromData.map(z => z.toUpperCase()).forEach(z => zoneNames.add(z))
  Object.keys(uppercaseLinks).forEach(linkName => {
    linkNames.add(linkName.toUpperCase())
    zoneNames.add(uppercaseLinks[linkName].toUpperCase())
  })

  if (zoneNames.has(uppercasedTz) || linkNames.has(uppercasedTz)) {
    return true
  }

  // 4. Return false
  return false
}
