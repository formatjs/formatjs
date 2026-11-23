import type {Temporal as PublicTemporal} from '#packages/temporal/index.js'

export function checkLegacyTimezoneVersions(
  Temporal: typeof PublicTemporal,
  fixture: string,
  Native: Intl.DateTimeFormatConstructor
): number {
  let checks = 0
  const rows = fixture
    .split('\n')
    .filter(line =>
      /^(America\/(Havana|Coyhaique)|Asia\/Kathmandu|UTC)\t/.test(line)
    )
  const selected = new Map<string, string[]>()
  for (const row of rows) {
    const [zone] = row.split('\t')
    let entries = selected.get(zone)
    if (!entries) selected.set(zone, (entries = []))
    if (entries.length < 2) entries.push(row)
  }
  if (selected.size !== 4) throw new Error('Incomplete ICU timezone selection')
  const equal = (actual: string, expected: string, context: string): void => {
    if (actual !== expected)
      throw new Error(`${context}: ${actual} !== ${expected}`)
  }
  const hostMatches = (
    zone: string,
    milliseconds: number,
    reference = zone
  ): boolean => {
    const clock: Intl.DateTimeFormatOptions = {
      calendar: 'iso8601',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }
    try {
      return (
        new Intl.DateTimeFormat('en', {...clock, timeZone: zone}).format(
          milliseconds
        ) ===
        new Native('en', {...clock, timeZone: reference}).format(milliseconds)
      )
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
      return false
    }
  }
  for (const row of [...selected.values()].flat()) {
    const [zone, milliseconds, seconds] = row.split('\t')
    const value = new Temporal.ZonedDateTime(
      BigInt(milliseconds) * 1000000n,
      zone
    )
    equal(
      String(value.offsetNanoseconds),
      String(BigInt(seconds) * 1000000000n),
      row
    )
    const minutes = Math.abs(+seconds) / 60
    const fixed = `${+seconds < 0 ? '-' : '+'}${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    const matches = hostMatches(zone, +milliseconds, fixed)
    for (const locale of ['en', 'ar-EG', 'fr', 'en-u-nu-mathsans']) {
      for (const options of [
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
          hourCycle: 'h23',
        },
        {hour: 'numeric', minute: '2-digit', timeZoneName: 'shortOffset'},
        {hour: 'numeric', minute: '2-digit', timeZoneName: 'longOffset'},
        {dateStyle: 'full', timeStyle: 'full'},
        {dateStyle: 'short', timeStyle: 'long'},
      ] as Intl.DateTimeFormatOptions[]) {
        const controls = {...options, calendar: 'iso8601'}
        const control = matches
          ? new Intl.DateTimeFormat(locale, {...controls, timeZone: zone})
          : new Native(locale, {...controls, timeZone: fixed})
        equal(
          value.toLocaleString(locale, controls),
          matches
            ? control.format(+milliseconds)
            : control
                .formatToParts(+milliseconds)
                .map(part => part.value)
                .join(''),
          `${locale} ${row} ${JSON.stringify(options)}`
        )
        checks++
      }
    }
  }
  const historical = new Temporal.ZonedDateTime(-123n, 'Africa/Monrovia')
  const historicalMatches = hostMatches('Africa/Monrovia', -1)
  for (const locale of ['en', 'ar-EG', 'fr']) {
    const options: Intl.DateTimeFormatOptions = {
      calendar: 'iso8601',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      fractionalSecondDigits: 3,
      timeZoneName: 'longOffset',
    }
    const control = new Native(locale, {
      ...options,
      timeZone: 'Africa/Monrovia',
    })
    equal(
      historical.toLocaleString(locale, options),
      historicalMatches
        ? control.format(-1)
        : control
            .formatToParts(-1)
            .map(part => part.value)
            .join(''),
      'Historical second offset and negative fractional millisecond'
    )
    checks++
  }
  for (const zone of ['America/Havana', 'Asia/Kathmandu']) {
    for (const milliseconds of [-8640000000000000, 8640000000000000]) {
      for (const locale of ['en', 'ar-EG']) {
        const options: Intl.DateTimeFormatOptions = {
          calendar: 'iso8601',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          weekday: 'long',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          timeZoneName: 'longOffset',
        }
        const value = new Temporal.ZonedDateTime(
          BigInt(milliseconds) * 1000000n,
          zone
        )
        const control = new Native(locale, {...options, timeZone: zone})
        equal(
          value.toLocaleString(locale, options),
          hostMatches(zone, milliseconds)
            ? control.format(milliseconds)
            : control
                .formatToParts(milliseconds)
                .map(part => part.value)
                .join(''),
          `Local day beyond TimeClip ${locale} ${zone} ${milliseconds}`
        )
        checks++
      }
    }
  }
  return checks
}
