/**
 * https://tc39.es/ecma402/#sec-isvalidtimezonename
 * @param tz
 * @param implDetails implementation details
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
  const uppercasedTz = tz.toUpperCase()
  const zoneNames = new Set()
  const linkNames = new Set()
  zoneNamesFromData.map(z => z.toUpperCase()).forEach(z => zoneNames.add(z))
  Object.keys(uppercaseLinks).forEach(linkName => {
    linkNames.add(linkName.toUpperCase())
    zoneNames.add(uppercaseLinks[linkName].toUpperCase())
  })
  return zoneNames.has(uppercasedTz) || linkNames.has(uppercasedTz)
}
