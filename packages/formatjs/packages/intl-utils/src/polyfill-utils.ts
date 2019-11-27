import aliases from './aliases';
import parentLocales from './parentLocales';
import {invariant} from './invariant';

/**
 * https://tc39.es/ecma262/#sec-toobject
 * @param arg
 */
export function toObject<T>(
  arg: T
): T extends null ? never : T extends undefined ? never : T {
  if (arg == null) {
    throw new TypeError('undefined/null cannot be converted to object');
  }
  return Object(arg);
}

/**
 * https://tc39.es/ecma402/#sec-getoption
 * @param opts
 * @param prop
 * @param type
 * @param values
 * @param fallback
 */
export function getOption<T extends object, K extends keyof T>(
  opts: T,
  prop: K,
  type: 'string' | 'boolean',
  values?: T[K][],
  fallback?: T[K]
): T[K] | undefined {
  // const descriptor = Object.getOwnPropertyDescriptor(opts, prop);
  let value: any = opts[prop];
  if (value !== undefined) {
    if (type !== 'boolean' && type !== 'string') {
      throw new TypeError('invalid type');
    }
    if (type === 'boolean') {
      value = Boolean(value);
    }
    if (type === 'string') {
      value = String(value);
    }
    if (values !== undefined && !values.filter(val => val == value).length) {
      throw new RangeError(`${value} in not within ${values}`);
    }
    return value;
  }
  return fallback;
}

export function getAliasesByLang(lang: string): Record<string, string> {
  return Object.keys(aliases).reduce((all: Record<string, string>, locale) => {
    if (locale.split('-')[0] === lang) {
      all[locale] = aliases[locale as 'zh-CN'];
    }
    return all;
  }, {});
}

export function getParentLocalesByLang(lang: string): Record<string, string> {
  return Object.keys(parentLocales).reduce(
    (all: Record<string, string>, locale) => {
      if (locale.split('-')[0] === lang) {
        all[locale] = parentLocales[locale as 'en-150'];
      }
      return all;
    },
    {}
  );
}

export function setInternalSlot<
  Instance extends object,
  Internal,
  Field extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  field: Field,
  value: Internal[Field]
) {
  if (!map.get(pl)) {
    map.set(pl, Object.create(null));
  }
  const slots = map.get(pl)! as Internal;
  slots[field] = value;
}

export function getInternalSlot<
  Instance extends object,
  Internal,
  Field extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  field: Field
): Internal[Field] {
  const slots = map.get(pl);
  if (!slots) {
    throw new TypeError(`${pl} InternalSlot has not been initialized`);
  }
  return slots[field];
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

export function partitionPattern(pattern: string) {
  const result = [];
  let beginIndex = pattern.indexOf('{');
  let endIndex = 0;
  let nextIndex = 0;
  const length = pattern.length;
  while (beginIndex < pattern.length && beginIndex > -1) {
    endIndex = pattern.indexOf('}', beginIndex);
    invariant(endIndex > beginIndex, `Invalid pattern ${pattern}`);
    if (beginIndex > nextIndex) {
      result.push({
        type: 'literal',
        value: pattern.substring(nextIndex, beginIndex),
      });
    }
    result.push({
      type: pattern.substring(beginIndex + 1, endIndex),
      value: undefined,
    });
    nextIndex = endIndex + 1;
    beginIndex = pattern.indexOf('{', nextIndex);
  }
  if (nextIndex < length) {
    result.push({
      type: 'literal',
      value: pattern.substring(nextIndex, length),
    });
  }
  return result;
}
