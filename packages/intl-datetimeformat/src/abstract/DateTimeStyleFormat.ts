import {
  DateTimeFormatLocaleInternalData,
  Formats,
  invariant,
} from '@formatjs/ecma402-abstract'

export function DateTimeStyleFormat(
  dateStyle: Intl.DateTimeFormatOptions['dateStyle'],
  timeStyle: Intl.DateTimeFormatOptions['timeStyle'],
  dataLocaleData: DateTimeFormatLocaleInternalData
): Formats {
  let dateFormat: Formats | undefined, timeFormat: Formats | undefined
  if (timeStyle !== undefined) {
    invariant(
      timeStyle === 'full' ||
        timeStyle === 'long' ||
        timeStyle === 'medium' ||
        timeStyle === 'short',
      'invalid timeStyle'
    )
    timeFormat = dataLocaleData.timeFormat[timeStyle]
  }
  if (dateStyle !== undefined) {
    invariant(
      dateStyle === 'full' ||
        dateStyle === 'long' ||
        dateStyle === 'medium' ||
        dateStyle === 'short',
      'invalid dateStyle'
    )
    dateFormat = dataLocaleData.dateFormat[dateStyle]
  }

  if (dateStyle !== undefined && timeStyle !== undefined) {
    const format = {} as Formats
    for (const field in dateFormat) {
      if (field !== 'pattern') {
        // @ts-ignore
        format[field] = dateFormat[field]
      }
    }
    for (const field in timeFormat) {
      if (field !== 'pattern' && field !== 'pattern12') {
        // @ts-ignore
        format[field] = timeFormat[field]
      }
    }
    const connector = dataLocaleData.dateTimeFormat[dateStyle]
    const pattern = connector
      .replace('{0}', timeFormat!.pattern)
      .replace('{1}', dateFormat!.pattern)
    format.pattern = pattern
    if ('pattern12' in timeFormat!) {
      const pattern12 = connector
        .replace('{0}', timeFormat!.pattern12)
        .replace('{1}', dateFormat!.pattern)
      format.pattern12 = pattern12
    }
    return format
  }
  if (timeStyle !== undefined) {
    return timeFormat!
  }
  invariant(dateStyle !== undefined, 'dateStyle should not be undefined')
  return dateFormat!
}
