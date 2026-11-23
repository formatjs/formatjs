const constructors = [
  'Instant',
  'Duration',
  'PlainDate',
  'PlainDateTime',
  'PlainTime',
  'PlainYearMonth',
  'PlainMonthDay',
  'ZonedDateTime',
]
const nowMethods = [
  'instant',
  'timeZoneId',
  'plainDateTimeISO',
  'plainDateISO',
  'plainTimeISO',
  'zonedDateTimeISO',
]
export function needsTemporal(): boolean {
  const temporal = (globalThis as {Temporal?: Record<string, unknown>}).Temporal
  if (!temporal || typeof temporal !== 'object') return true
  for (let i = 0; i < constructors.length; i++)
    if (typeof temporal[constructors[i]] !== 'function') return true
  const now = temporal.Now as Record<string, unknown> | undefined
  if (!now || typeof now !== 'object') return true
  for (let i = 0; i < nowMethods.length; i++)
    if (typeof now[nowMethods[i]] !== 'function') return true
  return false
}
