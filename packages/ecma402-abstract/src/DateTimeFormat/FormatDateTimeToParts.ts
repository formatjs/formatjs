import {PartitionDateTimePattern} from './PartitionDateTimePattern';
import ArrayCreate from 'es-abstract/2019/ArrayCreate';
import CreateDataPropertyOrThrow from 'es-abstract/2019/CreateDataPropertyOrThrow';
import CreateDataProperty from 'es-abstract/2019/CreateDataProperty';
import ToString from 'es-abstract/2019/ToString';

/**
 * https://tc39.es/ecma402/#sec-formatdatetimetoparts
 *
 * @param dtf
 * @param x
 * @param implDetails
 */
export function FormatDateTimeToParts(
  dtf: Intl.DateTimeFormat,
  x: number,
  implDetails: Parameters<typeof PartitionDateTimePattern>[2]
): Intl.DateTimeFormatPart[] {
  const parts = PartitionDateTimePattern(dtf, x, implDetails);
  const result = ArrayCreate(0) as Intl.DateTimeFormatPart[];
  let n = 0;
  for (const part of parts) {
    const o = {};
    CreateDataPropertyOrThrow(o, 'type', part.type);
    CreateDataPropertyOrThrow(o, 'value', part.value);
    CreateDataProperty(result, ToString(n), o);
    n++;
  }
  return result;
}
