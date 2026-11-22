import {
  ErrorConstructor,
  TypeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import type {BigDecimal} from '@formatjs/bigdecimal'
import {memoize, strategies} from '@formatjs/fast-memoize'

export function repeat(s: string, times: number): string {
  if (typeof s.repeat === 'function') {
    return s.repeat(times)
  }
  const arr = Array.from({length: times})
  for (let i = 0; i < arr.length; i++) {
    arr[i] = s
  }
  return arr.join('')
}

export function setInternalSlot<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal,
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  field: Field,
  value: NonNullable<Internal>[Field]
): void {
  if (!map.get(pl)) {
    map.set(pl, Object.create(null))
  }
  const slots = map.get(pl)!
  slots[field] = value
}

export function getInternalSlot<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal,
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  field: Field
): Internal[Field] {
  return getMultiInternalSlots(map, pl, field)[field]
}

export function getMultiInternalSlots<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal,
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  ...fields: Field[]
): Pick<Internal, Field> {
  const slots = map.get(pl)
  if (!slots) {
    throw new TypeErrorConstructor(
      `${pl} InternalSlot has not been initialized`
    )
  }
  return fields.reduce(
    (all, f) => {
      all[f] = slots[f]
      return all
    },
    Object.create(null) as Pick<Internal, Field>
  )
}

export interface LiteralPart {
  type: 'literal'
  value: string
}

export function isLiteralPart(
  patternPart: LiteralPart | {type: string; value?: string}
): patternPart is LiteralPart {
  return patternPart.type === 'literal'
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
): void {
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: false,
    writable: true,
    value,
  })
}

export function ensureIntl(): typeof Intl {
  if (typeof Intl === 'undefined') {
    Object.defineProperty(globalThis, 'Intl', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: {},
    })
  }
  if (providerIntl === undefined) providerIntl = Intl
  return Intl
}

/**
 * 7.3.5 CreateDataProperty
 * @param target
 * @param name
 * @param value
 */
export function createDataProperty<T extends object>(
  target: T,
  name: string | symbol,
  value: any
): void {
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  })
}

export function invariant(
  condition: boolean,
  message: string,
  Err: any = ErrorConstructor
): asserts condition {
  if (!condition) {
    throw new Err(message)
  }
}

// Native NumberFormat coerces non-primitive inputs via ToPrimitive (calling
// `toString()`) before feeding them to ToIntlMathematicalValue, so a
// `BigDecimal` passed to `format`/`formatToParts` is parsed as an exact
// StringNumericLiteral. The widened return type lets call sites carry
// BigDecimal end-to-end without lossy intermediate `.toString()` casts.
type NumberFormatLike = Omit<Intl.NumberFormat, 'format' | 'formatToParts'> & {
  format(value: number | bigint | string | BigDecimal | undefined): string
  formatToParts(
    value: number | bigint | string | BigDecimal | undefined
  ): Intl.NumberFormatPart[]
}

export const createMemoizedNumberFormat: (
  ...args: ConstructorParameters<typeof Intl.NumberFormat>
) => NumberFormatLike = memoize(
  (...args: ConstructorParameters<typeof Intl.NumberFormat>) =>
    new Intl.NumberFormat(...args) as NumberFormatLike,
  {
    strategy: strategies.variadic,
  }
)

export const createMemoizedPluralRules: (
  ...args: ConstructorParameters<typeof Intl.PluralRules>
) => Intl.PluralRules = memoize(
  (...args: ConstructorParameters<typeof Intl.PluralRules>) =>
    new Intl.PluralRules(...args),
  {
    strategy: strategies.variadic,
  }
)

export const createMemoizedListFormat: (
  ...args: ConstructorParameters<typeof Intl.ListFormat>
) => Intl.ListFormat = memoize(
  (...args: ConstructorParameters<typeof Intl.ListFormat>) =>
    new Intl.ListFormat(...args),
  {
    strategy: strategies.variadic,
  }
)

const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
let providerIntl = globalThis.Intl
function ownIntlProvider(name: 'NumberFormat' | 'ListFormat'): unknown {
  const descriptor =
    providerIntl && getOwnPropertyDescriptor(providerIntl, name)
  const value = descriptor && getOwnPropertyDescriptor(descriptor, 'value')
  return value?.value
}
let numberFormatProvider = ownIntlProvider(
  'NumberFormat'
) as typeof Intl.NumberFormat
let listFormatProvider = ownIntlProvider('ListFormat') as typeof Intl.ListFormat

// Temporal comparison §§15.10.1–2 step4: retain supplied providers without accessor Gets.
// https://tc39.es/proposal-temporal/#sec-Intl.DurationFormat.prototype.format
export function getNumberFormatProvider(): typeof Intl.NumberFormat {
  const candidate = ownIntlProvider('NumberFormat')
  if (typeof candidate === 'function')
    numberFormatProvider = candidate as typeof Intl.NumberFormat
  return numberFormatProvider
}
export function getListFormatProvider(): typeof Intl.ListFormat {
  const candidate = ownIntlProvider('ListFormat')
  if (typeof candidate === 'function')
    listFormatProvider = candidate as typeof Intl.ListFormat
  return listFormatProvider
}

const numberFormatMemoizers = new WeakMap<
  typeof Intl.NumberFormat,
  typeof createMemoizedNumberFormat
>()
const getNumberFormatMemoizer = numberFormatMemoizers.get.bind(
  numberFormatMemoizers
)
const setNumberFormatMemoizer = numberFormatMemoizers.set.bind(
  numberFormatMemoizers
)
const listFormatMemoizers = new WeakMap<
  typeof Intl.ListFormat,
  typeof createMemoizedListFormat
>()
const getListFormatMemoizer = listFormatMemoizers.get.bind(listFormatMemoizers)
const setListFormatMemoizer = listFormatMemoizers.set.bind(listFormatMemoizers)

export function createMemoizedNumberFormatForConstructor(
  Constructor: typeof Intl.NumberFormat
): typeof createMemoizedNumberFormat {
  let factory = getNumberFormatMemoizer(Constructor)
  if (!factory) {
    factory = memoize(
      (...args: ConstructorParameters<typeof Intl.NumberFormat>) =>
        new Constructor(args[0], args[1]) as NumberFormatLike,
      {strategy: strategies.variadic}
    )
    setNumberFormatMemoizer(Constructor, factory)
  }
  return factory
}

export function createMemoizedListFormatForConstructor(
  Constructor: typeof Intl.ListFormat
): typeof createMemoizedListFormat {
  let factory = getListFormatMemoizer(Constructor)
  if (!factory) {
    factory = memoize(
      (...args: ConstructorParameters<typeof Intl.ListFormat>) =>
        new Constructor(args[0], args[1]),
      {strategy: strategies.variadic}
    )
    setListFormatMemoizer(Constructor, factory)
  }
  return factory
}
