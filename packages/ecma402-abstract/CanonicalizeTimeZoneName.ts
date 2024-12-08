/**
 * https://tc39.es/ecma402/#sec-canonicalizetimezonename
 * @param tz
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
  const uppercasedTz = tz.toUpperCase()
  const uppercasedZones = zoneNames.reduce((all: Record<string, string>, z) => {
    all[z.toUpperCase()] = z
    return all
  }, {})
  const ianaTimeZone =
    uppercaseLinks[uppercasedTz] || uppercasedZones[uppercasedTz]
  if (ianaTimeZone === 'Etc/UTC' || ianaTimeZone === 'Etc/GMT') {
    return 'UTC'
  }
  return ianaTimeZone
}
