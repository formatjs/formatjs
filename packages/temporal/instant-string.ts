import {isoToEpochNanoseconds} from '#packages/temporal/kernel.js'

function offsetNanoseconds(value: string, annotation = false): bigint {
  const match =
    /^([+-])(\d{2})(?:(:?)(\d{2})(?:\3(\d{2})(?:[.,](\d{1,9}))?)?)?$/.exec(
      value
    )
  if (!match || match[0] !== value || (annotation && match[5] !== undefined))
    throw new RangeError('Invalid UTC offset')
  const hour = +match[2],
    minute = +(match[4] ?? 0),
    second = +(match[5] ?? 0)
  if (hour > 23 || minute > 59 || second > 59)
    throw new RangeError('Invalid UTC offset')
  const result =
    BigInt(hour * 3600 + minute * 60 + second) * 1_000_000_000n +
    BigInt((match[6] ?? '').padEnd(9, '0'))
  return match[1] === '-' ? -result : result
}

function validateAnnotations(value: string): void {
  let calendarSeen = false,
    criticalCalendar = false,
    annotationSeen = false,
    zoneSeen = false
  while (value) {
    const match = /^\[(!?)([^[\]]+)\]/.exec(value)
    if (!match) throw new RangeError('Invalid annotation')
    const critical = match[1] === '!'
    const text = match[2]
    if (text.includes('=')) {
      const annotation =
        /^([a-z_][a-z_0-9-]*)=([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)$/.exec(text)
      if (!annotation || annotation[0] !== text)
        throw new RangeError('Invalid annotation')
      annotationSeen = true
      if (annotation[1] === 'u-ca') {
        if (calendarSeen && (critical || criticalCalendar))
          throw new RangeError('Duplicate critical calendar annotation')
        calendarSeen = true
        criticalCalendar ||= critical
      } else if (critical) throw new RangeError('Unknown critical annotation')
    } else {
      if (zoneSeen || annotationSeen)
        throw new RangeError('Unexpected timezone annotation')
      zoneSeen = true
      if (/^[+-]/.test(text)) offsetNanoseconds(text, true)
      else if (
        !/^[A-Za-z._][A-Za-z._0-9+-]*(?:\/[A-Za-z._][A-Za-z._0-9+-]*)*(?![\s\S])/.test(
          text
        )
      )
        throw new RangeError('Invalid timezone annotation')
    }
    value = value.slice(match[0].length)
  }
}

export function parseInstantString(value: string): bigint {
  const match =
    /^([+-]\d{6}|\d{4})(-?)(\d{2})\2(\d{2})[Tt ](\d{2})(?:(:?)(\d{2})(?:\6(\d{2})(?:[.,](\d{1,9}))?)?)?([Zz]|[+-]\d{2}(?::?\d{2}(?::?\d{2}(?:[.,]\d{1,9})?)?)?)([\s\S]*)$/.exec(
      value
    )
  if (!match || match[1] === '-000000')
    throw new RangeError('Invalid instant string')
  validateAnnotations(match[11])
  const fraction = (match[9] ?? '').padEnd(9, '0')
  const second = +(match[8] ?? 0)
  const local = isoToEpochNanoseconds({
    year: +match[1],
    month: +match[3],
    day: +match[4],
    hour: +match[5],
    minute: +(match[7] ?? 0),
    second: second === 60 ? 59 : second,
    millisecond: +fraction.slice(0, 3),
    microsecond: +fraction.slice(3, 6),
    nanosecond: +fraction.slice(6, 9),
  })
  return local - (/^[Zz]$/.test(match[10]) ? 0n : offsetNanoseconds(match[10]))
}
