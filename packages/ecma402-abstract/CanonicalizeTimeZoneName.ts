// Cached regex patterns for performance
const OFFSET_TIMEZONE_PREFIX_REGEX = /^[+-]/
const OFFSET_TIMEZONE_FORMAT_REGEX =
  /^([+-])(\d{2})(?::?(\d{2}))?(?::?(\d{2}))?(?:\.(\d{1,9}))?$/
const TRAILING_ZEROS_REGEX = /0+$/

/**
 * IsTimeZoneOffsetString ( offsetString )
 * https://tc39.es/ecma262/#sec-istimezoneoffsetstring
 *
 * Simplified check to determine if a string is a UTC offset identifier.
 *
 * @param offsetString - The string to check
 * @returns true if offsetString starts with '+' or '-'
 */
function IsTimeZoneOffsetString(offsetString: string): boolean {
  // 1. If offsetString does not start with '+' or '-', return false
  return OFFSET_TIMEZONE_PREFIX_REGEX.test(offsetString)
}

/**
 * ParseTimeZoneOffsetString ( offsetString )
 * https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring
 *
 * Parses a UTC offset string and returns its canonical representation.
 * Normalizes various formats (±HH, ±HHMM, ±HH:MM, etc.) to ±HH:MM format.
 *
 * @param offsetString - The UTC offset string to parse
 * @returns The canonical offset string in ±HH:MM format (with :SS.sss if non-zero)
 */
function ParseTimeZoneOffsetString(offsetString: string): string {
  // 1. Let parseResult be ParseText(offsetString, UTCOffset)
  const match = OFFSET_TIMEZONE_FORMAT_REGEX.exec(offsetString)

  // 2. Assert: parseResult is not a List of errors (validated by IsValidTimeZoneName)
  if (!match) {
    return offsetString
  }

  // 3. Extract components from parseResult
  const sign = match[1]
  const hours = match[2]
  const minutes = match[3] ? match[3] : '00'
  const seconds = match[4]
  const fractional = match[5]

  // 4. Build canonical format: ±HH:MM
  let canonical = `${sign}${hours}:${minutes}`

  // 5. If seconds are present and non-zero (or fractional present), include them
  if (seconds && (parseInt(seconds, 10) !== 0 || fractional)) {
    canonical += `:${seconds}`

    // 6. If fractional seconds present, include them (trim trailing zeros)
    if (fractional) {
      const trimmedFractional = fractional.replace(TRAILING_ZEROS_REGEX, '')
      if (trimmedFractional) {
        canonical += `.${trimmedFractional}`
      }
    }
  }

  // 7. Return canonical representation
  return canonical
}

/**
 * CanonicalizeTimeZoneName ( timeZone )
 * https://tc39.es/ecma402/#sec-canonicalizetimezonename
 *
 * Extended to support UTC offset time zones per ECMA-402 PR #788 (ES2026).
 * Returns the canonical and case-regularized form of a timezone identifier.
 *
 * @param tz - The timezone identifier to canonicalize
 * @param implDetails - Implementation details containing timezone data
 * @returns The canonical timezone identifier
 */
export function CanonicalizeTimeZoneName(
  tz: string,
  {
    zoneNames,
    uppercaseLinks,
  }: {
    zoneNames: readonly string[]
    uppercaseLinks: Record<string, string>
  }
): string {
  // 1. If IsTimeZoneOffsetString(timeZone) is true, then
  //    a. Return ParseTimeZoneOffsetString(timeZone)
  // Per ECMA-402 PR #788, UTC offset identifiers are canonicalized
  if (IsTimeZoneOffsetString(tz)) {
    return ParseTimeZoneOffsetString(tz)
  }

  // 2. Let ianaTimeZone be the String value of the Zone or Link name
  //    in the IANA Time Zone Database that is an ASCII-case-insensitive
  //    match of timeZone
  const uppercasedTz = tz.toUpperCase()
  const uppercasedZones = zoneNames.reduce((all: Record<string, string>, z) => {
    all[z.toUpperCase()] = z
    return all
  }, {})
  const ianaTimeZone =
    uppercaseLinks[uppercasedTz] || uppercasedZones[uppercasedTz]

  // 3. If ianaTimeZone is "Etc/UTC" or "Etc/GMT", return "UTC"
  if (ianaTimeZone === 'Etc/UTC' || ianaTimeZone === 'Etc/GMT') {
    return 'UTC'
  }

  // 4. Return ianaTimeZone
  return ianaTimeZone
}
