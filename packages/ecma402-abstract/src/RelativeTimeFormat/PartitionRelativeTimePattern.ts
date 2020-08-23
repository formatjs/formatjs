import {
  RelativeTimeFormattableUnit,
  RelativeTimeFormatNumberPart,
  FieldData,
  RelativeTimeField,
  RelativeTimeFormat,
  RelativeTimeFormatInternal,
  RelativeTimePart,
} from '../../types/relative-time';
import Type from 'es-abstract/2019/Type';
import {invariant} from '../utils';
import {SingularRelativeTimeUnit} from './SingularRelativeTimeUnit';
import {MakePartsList} from './MakePartsList';
import {LDMLPluralRule} from '../../types/plural-rules';
import SameValue from 'es-abstract/2019/SameValue';
import ToString from 'es-abstract/2019/ToString';

export function PartitionRelativeTimePattern(
  rtf: RelativeTimeFormat,
  value: number,
  unit: RelativeTimeFormattableUnit,
  {
    getInternalSlots,
  }: {
    getInternalSlots(rtf: RelativeTimeFormat): RelativeTimeFormatInternal;
  }
): RelativeTimePart[] {
  invariant(
    Type(value) === 'Number',
    `value must be number, instead got ${typeof value}`,
    TypeError
  );
  invariant(
    Type(unit) === 'String',
    `unit must be number, instead got ${typeof value}`,
    TypeError
  );
  if (isNaN(value) || !isFinite(value)) {
    throw new RangeError(`Invalid value ${value}`);
  }
  const resolvedUnit = SingularRelativeTimeUnit(unit);
  const {fields, style, numeric, pluralRules, numberFormat} = getInternalSlots(
    rtf
  );
  let entry: RelativeTimeField = resolvedUnit;
  if (style === 'short') {
    entry = `${resolvedUnit}-short` as RelativeTimeField;
  } else if (style === 'narrow') {
    entry = `${resolvedUnit}-narrow` as RelativeTimeField;
  }
  if (!(entry in fields)) {
    entry = resolvedUnit as RelativeTimeField;
  }
  const patterns = fields[entry]!;

  if (numeric === 'auto') {
    if (ToString(value) in patterns) {
      return [
        {
          type: 'literal',
          value: patterns[ToString(value) as '-1']!,
        },
      ];
    }
  }
  let tl: keyof FieldData = 'future';
  if (SameValue(value, -0) || value < 0) {
    tl = 'past';
  }
  const po = patterns[tl];
  const fv =
    typeof numberFormat.formatToParts === 'function'
      ? numberFormat.formatToParts(Math.abs(value))
      : // TODO: If formatToParts is not supported, we assume the whole formatted
        // number is a part
        [
          {
            type: 'literal',
            value: numberFormat.format(Math.abs(value)),
            unit,
          } as RelativeTimeFormatNumberPart,
        ];
  const pr = pluralRules.select(value) as LDMLPluralRule;
  const pattern = po[pr];
  return MakePartsList(pattern!, resolvedUnit, fv);
}
