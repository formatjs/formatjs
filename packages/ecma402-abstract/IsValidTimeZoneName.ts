// Cached regex patterns for performance
const OFFSET_TIMEZONE_PREFIX_REGEX = /^[+-]/
const OFFSET_TIMEZONE_FORMAT_REGEX =
  /^([+-])(\d{2})(?::?(\d{2}))?(?::?(\d{2}))?(?:\.(\d{1,9}))?$/

/**
 * IsTimeZoneOffsetString ( offsetString )
 * https://tc39.es/ecma262/#sec-istimezoneoffsetstring
 *
 * Validates whether a string represents a valid UTC offset timezone.
 * Supports formats: ±HH, ±HHMM, ±HH:MM, ±HH:MM:SS, ±HH:MM:SS.sss
 *
 * @param offsetString - The string to validate as a timezone offset
 * @returns true if offsetString is a valid UTC offset format
 */
function IsTimeZoneOffsetString(offsetString: string): boolean {
  // 1. If offsetString does not start with '+' or '-', return false
  if (!OFFSET_TIMEZONE_PREFIX_REGEX.test(offsetString)) {
    return false
  }

  // 2. Let parseResult be ParseText(offsetString, UTCOffset)
  const match = OFFSET_TIMEZONE_FORMAT_REGEX.exec(offsetString)

  // 3. If parseResult is a List of errors, return false
  if (!match) {
    return false
  }

  // 4. Validate component ranges per ECMA-262 grammar
  // Hour must be 0-23, Minute must be 0-59, Second must be 0-59
  const hours = parseInt(match[2], 10)
  const minutes = match[3] ? parseInt(match[3], 10) : 0
  const seconds = match[4] ? parseInt(match[4], 10) : 0

  if (hours > 23 || minutes > 59 || seconds > 59) {
    return false
  }

  // 5. Return true
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
  // 1. If IsTimeZoneOffsetString(timeZone) is true, return true
  // Per ECMA-402 PR #788, UTC offset identifiers are valid
  if (IsTimeZoneOffsetString(tz)) {
    return true
  }

  // 2. Let timeZones be AvailableNamedTimeZoneIdentifiers()
  // 3. If timeZones contains an element equal to timeZone, return true
  // NOTE: Implementation uses case-insensitive comparison per spec note
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
