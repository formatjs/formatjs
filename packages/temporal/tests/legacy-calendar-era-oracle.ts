import type {Temporal as PublicTemporal} from '#packages/temporal/index.js'
type Namespace = typeof PublicTemporal
function assert(
  value: unknown,
  context = 'Legacy calendar control failed'
): asserts value {
  if (!value) throw new Error(context)
}
function equal(
  actual: unknown,
  expected: unknown,
  context = 'Legacy calendar fields'
): void {
  if (actual !== expected)
    throw new Error(`${context}: ${String(actual)} !== ${String(expected)}`)
}
function sameParts(
  actual: Intl.DateTimeFormatPart[],
  expected: Intl.DateTimeFormatPart[]
): void {
  equal(
    JSON.stringify(actual),
    JSON.stringify(expected),
    'Host clock and zone preserved'
  )
}
export function checkLegacyCalendarEras(
  Temporal: Namespace,
  fixture: string,
  Native: typeof Intl.DateTimeFormat
): number {
  const calendars = new Set([
    'buddhist',
    'japanese',
    'roc',
    'coptic',
    'ethiopic',
    'ethioaa',
    'indian',
    'islamic-civil',
    'islamic-tbla',
  ])
  const all = fixture
    .split('\n')
    .filter(line => line.startsWith('F\t'))
    .map(line => line.split('\t'))
    .filter(row => calendars.has(row[1]) && +row[2] >= -100000000)
  const rows: string[][] = []
  for (const calendar of calendars) {
    const source = all.filter(row => row[1] === calendar)
    // Full-range negative years, era boundaries and modern compatibility controls.
    for (const epoch of [
      -100000000, -2092590, -719529, -719528, -35429, -35428, 0, 19782,
      100000000,
    ]) {
      const row = source.find(row => +row[2] === epoch)
      assert(row, `${calendar} independent ICU sample ${epoch}`)
      rows.push(row)
    }
  }
  let checks = 0
  for (const locale of ['en', 'ar-EG', 'ja', 'en-u-nu-mathsans']) {
    const number = new Intl.NumberFormat(locale, {useGrouping: false}).format
    const two = new Intl.NumberFormat(locale, {
      useGrouping: false,
      minimumIntegerDigits: 2,
    }).format
    for (const timeZone of ['UTC', 'Asia/Kathmandu', 'America/New_York']) {
      for (const row of rows) {
        const calendar = row[1],
          epoch = +row[2],
          eraYear = +row[11]
        const milliseconds =
          epoch * 86400000 + (epoch === 100000000 ? 0 : 43217123)
        const options: Intl.DateTimeFormatOptions = {
          calendar,
          timeZone,
          era: 'short',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
          timeZoneName: 'longOffset',
          hourCycle: 'h23',
        }
        // At the maximum instant, a negative offset selects the previous civil day.
        if (epoch === 100000000 && timeZone === 'America/New_York') continue
        const formatter = new Intl.DateTimeFormat(locale, options)
        const actual = formatter.formatToParts(milliseconds)
        const year = actual.find(part => part.type === 'year')?.value
        equal(
          year,
          number(eraYear),
          `${locale} ${calendar} ${epoch} ${timeZone}`
        )
        for (const [type, expected] of [
          ['month', +row[4]],
          ['day', +row[6]],
        ] as const)
          assert(
            [number(expected), two(expected)].includes(
              actual.find(part => part.type === type)?.value ?? ''
            ),
            `${calendar} ${epoch} ${type}`
          )
        if (locale === 'en' && row[10] === 'bh')
          equal(actual.find(part => part.type === 'era')?.value, 'BH')
        if (calendar === 'japanese' && epoch < -35428) {
          // Best-fit field widths can differ between calendars.
          const expected = new Native(locale, {
            ...formatter.resolvedOptions(),
            calendar: 'gregory',
          } as Intl.DateTimeFormatOptions)
            .formatToParts(milliseconds)
            .find(part => part.type === 'era')?.value
          equal(actual.find(part => part.type === 'era')?.value, expected)
        }
        const clock = (parts: Intl.DateTimeFormatPart[]) =>
          parts.filter(part =>
            [
              'weekday',
              'hour',
              'minute',
              'second',
              'fractionalSecond',
              'timeZoneName',
            ].includes(part.type)
          )
        sameParts(
          clock(actual),
          clock(
            new Native(locale, {...options, calendar: 'gregory'}).formatToParts(
              milliseconds
            )
          )
        )
        const text = actual.map(part => part.value).join('')
        equal(formatter.format(milliseconds), text)
        equal(formatter.format(new Date(milliseconds)), text)
        equal(
          formatter.format(
            Temporal.Instant.fromEpochMilliseconds(
              milliseconds
            ) as unknown as Date
          ),
          text
        )
        const zoned = Temporal.Instant.fromEpochMilliseconds(milliseconds)
          .toZonedDateTimeISO(timeZone)
          .withCalendar(calendar)
        const {timeZone: _timeZone, ...zonedOptions} = options
        equal(zoned.toLocaleString(locale, zonedOptions), text)
        const range = formatter.formatRangeToParts(milliseconds, milliseconds)
        assert(range.every(part => part.source === 'shared'))
        equal(formatter.formatRange(milliseconds, milliseconds), text)
        if (epoch === -35429) {
          const end = milliseconds + 86400000,
            endRow = rows.find(
              item => item[1] === calendar && +item[2] === -35428
            )!,
            range = formatter.formatRangeToParts(milliseconds, end)
          for (const [source, expected] of [
            ['startRange', eraYear],
            ['endRange', +endRow[11]],
          ] as const)
            equal(
              range
                .filter(
                  part =>
                    part.source !==
                    (source === 'startRange' ? 'endRange' : 'startRange')
                )
                .find(part => part.type === 'year')?.value,
              number(expected),
              `${calendar} era-boundary range ${source}`
            )
          equal(
            formatter.formatRange(milliseconds, end),
            range.map(part => part.value).join('')
          )
        }
        checks++
      }
    }
  }
  return checks
}
