let checked = 0
for (const line of __temporalLocaleOracle) {
  const [kind, locale, zone, milliseconds, rawOptions, expected] =
    line.split('\t')
  const ns = BigInt(milliseconds) * 1000000n
  const utc = new Temporal.ZonedDateTime(ns, 'UTC')
  const date = utc.toPlainDate().withCalendar('gregory')
  const value =
    kind === 'PlainDate'
      ? date
      : kind === 'PlainTime'
        ? utc.toPlainTime()
        : kind === 'PlainDateTime'
          ? utc.toPlainDateTime().withCalendar('gregory')
          : kind === 'PlainYearMonth'
            ? date.toPlainYearMonth()
            : kind === 'PlainMonthDay'
              ? date.toPlainMonthDay()
              : kind === 'Instant'
                ? new Temporal.Instant(ns)
                : new Temporal.ZonedDateTime(ns, zone, 'gregory')
  const actual = value.toLocaleString(locale, JSON.parse(rawOptions))
  if (actual !== expected) throw new Error(line + '\tactual=' + actual)
  checked++
}
if (checked !== 768) throw new Error('Incomplete ICU locale fixture')

for (const [zone, expected] of [
  ['+00:00', 'GMT+0'],
  ['+01:00', 'GMT+1'],
  ['-01:00', 'GMT-1'],
  ['+05:30', 'GMT+5:30'],
  ['-00:30', 'GMT-0:30'],
]) {
  const actual = new Temporal.ZonedDateTime(0n, zone).toLocaleString('en')
  if (!actual.includes(expected)) throw new Error(zone + ': ' + actual)
}
print('Temporal SDK ICU locale cases: ' + checked)
