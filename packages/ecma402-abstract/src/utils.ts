/**
 * Cannot do Math.log(x) / Math.log(10) bc if IEEE floating point issue
 * @param x number
 */
export function getMagnitude(x: number): number {
  // Cannot count string length via Number.toString because it may use scientific notation
  // for very small or very large numbers.
  return Math.floor(Math.log(x) * Math.LOG10E);
}

export function repeat(s: string, times: number): string {
  if (typeof s.repeat === 'function') {
    return s.repeat(times);
  }
  const arr = new Array(times);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = s;
  }
  return arr.join('');
}

export function setInternalSlot<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  field: Field,
  value: NonNullable<Internal>[Field]
) {
  if (!map.get(pl)) {
    map.set(pl, Object.create(null));
  }
  const slots = map.get(pl)!;
  slots[field] = value;
}

export function setMultiInternalSlots<
  Instance extends object,
  Internal extends object,
  K extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  props: Pick<NonNullable<Internal>, K>
) {
  for (const k of Object.keys(props) as K[]) {
    setInternalSlot(map, pl, k, props[k]);
  }
}

export function getInternalSlot<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  field: Field
): Internal[Field] {
  return getMultiInternalSlots(map, pl, field)[field];
}

export function getMultiInternalSlots<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  ...fields: Field[]
): Pick<Internal, Field> {
  const slots = map.get(pl);
  if (!slots) {
    throw new TypeError(`${pl} InternalSlot has not been initialized`);
  }
  return fields.reduce((all, f) => {
    all[f] = slots[f];
    return all;
  }, Object.create(null) as Pick<Internal, Field>);
}

export interface LiteralPart {
  type: 'literal';
  value: string;
}

export function isLiteralPart(
  patternPart: LiteralPart | {type: string; value?: string}
): patternPart is LiteralPart {
  return patternPart.type === 'literal';
}

/*
  17 ECMAScript Standard Built-in Objects:
    Every built-in Function object, including constructors, that is not
    identified as an anonymous function has a name property whose value
    is a String.

    Unless otherwise specified, the name property of a built-in Function
    object, if it exists, has the attributes { [[Writable]]: false,
    [[Enumerable]]: false, [[Configurable]]: true }.
*/
export function defineProperty<T extends object>(
  target: T,
  name: string | symbol,
  {value}: {value: any} & ThisType<any>
) {
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: false,
    writable: true,
    value,
  });
}

export const UNICODE_EXTENSION_SEQUENCE_REGEX = /-u(?:-[0-9a-z]{2,8})+/gi;

export function invariant(
  condition: boolean,
  message: string,
  Err: any = Error
): asserts condition {
  if (!condition) {
    throw new Err(message);
  }
}
