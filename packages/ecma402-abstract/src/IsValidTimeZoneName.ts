/**
 * https://tc39.es/ecma402/#sec-isvalidtimezonename
 * @param tz
 * @param implDetails implementation details
 */
export function IsValidTimeZoneName(
  tz: string,
  {
    tzData,
    uppercaseLinks,
  }: {
    tzData: Record<string, unknown>;
    uppercaseLinks: Record<string, unknown>;
  }
): boolean {
  const uppercasedTz = tz.toUpperCase();
  const zoneNames = new Set(Object.keys(tzData).map(z => z.toUpperCase()));
  return zoneNames.has(uppercasedTz) || uppercasedTz in uppercaseLinks;
}
