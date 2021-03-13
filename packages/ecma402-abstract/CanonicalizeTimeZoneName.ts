/**
 * https://tc39.es/ecma402/#sec-canonicalizetimezonename
 * @param tz
 */
export function CanonicalizeTimeZoneName(
  tz: string,
  {
    tzData,
    uppercaseLinks,
  }: {
    tzData: Record<string, unknown>
    uppercaseLinks: Record<string, string>
  }
) {
  const uppercasedTz = tz.toUpperCase()
  const uppercasedZones = Object.keys(tzData).reduce(
    (all: Record<string, string>, z) => {
      all[z.toUpperCase()] = z
      return all
    },
    {}
  )
  const ianaTimeZone =
    uppercaseLinks[uppercasedTz] || uppercasedZones[uppercasedTz]
  if (ianaTimeZone === 'Etc/UTC' || ianaTimeZone === 'Etc/GMT') {
    return 'UTC'
  }
  return ianaTimeZone
}
