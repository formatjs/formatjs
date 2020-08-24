import {DateTimeFormatOptions} from '../../types/date-time';
import ToObject from 'es-abstract/2019/ToObject';
import Get from 'es-abstract/2019/Get';
import ObjectCreate from 'es-abstract/2019/ObjectCreate';
import CreateDataPropertyOrThrow from 'es-abstract/2019/CreateDataPropertyOrThrow';

/**
 * https://tc39.es/ecma402/#sec-todatetimeoptions
 * @param options
 * @param required
 * @param defaults
 */
export function ToDateTimeOptions(
  options?: DateTimeFormatOptions | null,
  required?: string,
  defaults?: string
): DateTimeFormatOptions {
  if (options === undefined) {
    options = null;
  } else {
    options = ToObject(options);
  }
  options = ObjectCreate(options) as DateTimeFormatOptions;
  let needDefaults = true;
  if (required === 'date' || required === 'any') {
    for (const prop of ['weekday', 'year', 'month', 'day'] as Array<
      keyof Pick<DateTimeFormatOptions, 'weekday' | 'year' | 'month' | 'day'>
    >) {
      const value = Get(options, prop);
      if (value !== undefined) {
        needDefaults = false;
      }
    }
  }
  if (required === 'time' || required === 'any') {
    for (const prop of ['hour', 'minute', 'second'] as Array<
      keyof Pick<DateTimeFormatOptions, 'hour' | 'minute' | 'second'>
    >) {
      const value = Get(options, prop);
      if (value !== undefined) {
        needDefaults = false;
      }
    }
  }
  if (options.dateStyle !== undefined || options.timeStyle !== undefined) {
    needDefaults = false;
  }
  if (required === 'date' && options.timeStyle) {
    throw new TypeError(
      'Intl.DateTimeFormat date was required but timeStyle was included'
    );
  }
  if (required === 'time' && options.dateStyle) {
    throw new TypeError(
      'Intl.DateTimeFormat time was required but dateStyle was included'
    );
  }

  if (needDefaults && (defaults === 'date' || defaults === 'all')) {
    for (const prop of ['year', 'month', 'day'] as Array<
      keyof Pick<DateTimeFormatOptions, 'year' | 'month' | 'day'>
    >) {
      CreateDataPropertyOrThrow(options, prop, 'numeric');
    }
  }
  if (needDefaults && (defaults === 'time' || defaults === 'all')) {
    for (const prop of ['hour', 'minute', 'second'] as Array<
      keyof Pick<DateTimeFormatOptions, 'hour' | 'minute' | 'second'>
    >) {
      CreateDataPropertyOrThrow(options, prop, 'numeric');
    }
  }
  return options;
}
