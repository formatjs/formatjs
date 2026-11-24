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
    const intl = {}
    // ECMA-402 §8.1.1 sets the Intl namespace tag.
    // https://tc39.es/ecma402/#sec-intl-%symbol.tostringtag%
    if (typeof Symbol !== 'undefined') {
      Object.defineProperty(intl, Symbol.toStringTag, {
        value: 'Intl',
        writable: false,
        enumerable: false,
        configurable: true,
      })
    }
    Object.defineProperty(globalThis, 'Intl', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: intl,
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
// Temporal comparison §15.11.1.1 step 3: private memoizer options.
const formatterMemoizeOptions = {
  __proto__: null,
  strategy: strategies.variadic,
}
let providerIntl = globalThis.Intl
function ownIntlProvider(name: string | symbol): unknown {
  const descriptor =
    providerIntl && getOwnPropertyDescriptor(providerIntl, name)
  const value = descriptor && getOwnPropertyDescriptor(descriptor, 'value')
  return value?.value
}
let numberFormatProvider = ownIntlProvider(
  'NumberFormat'
) as typeof Intl.NumberFormat
let listFormatProvider = ownIntlProvider('ListFormat') as typeof Intl.ListFormat
let pluralRulesProvider = ownIntlProvider(
  'PluralRules'
) as typeof Intl.PluralRules

type FormatterIntrinsicName = 'NumberFormat' | 'PluralRules'
const formatterIntrinsicKeys: Record<FormatterIntrinsicName, symbol> = {
  NumberFormat: Symbol.for('@formatjs/intlNumberFormat'),
  PluralRules: Symbol.for('@formatjs/intlPluralRules'),
}
const defineIntrinsic = Object.defineProperty
const isExtensible = Object.isExtensible
let numberFormatIntrinsic = numberFormatProvider

export function registerFormatterIntrinsic(
  intl: typeof Intl,
  name: FormatterIntrinsicName,
  Constructor: new (...args: never[]) => object
): void {
  const key = formatterIntrinsicKeys[name]
  if (getOwnPropertyDescriptor(intl, key) || isExtensible(intl)) {
    defineIntrinsic(intl, key, {
      __proto__: null,
      configurable: true,
      value: Constructor,
    } as PropertyDescriptor)
  }
}

// ECMA-402 §11.5.4 steps 5, 10, and 11.f construct %Intl.NumberFormat%.
// https://tc39.es/ecma402/#sec-formatdatetimepattern
export function getNumberFormatIntrinsic(): typeof Intl.NumberFormat {
  if (providerIntl === undefined) providerIntl = globalThis.Intl
  const registered = ownIntlProvider(formatterIntrinsicKeys.NumberFormat)
  if (typeof registered === 'function')
    return registered as typeof Intl.NumberFormat
  if (typeof numberFormatIntrinsic !== 'function')
    numberFormatIntrinsic = ownIntlProvider(
      'NumberFormat'
    ) as typeof Intl.NumberFormat
  return numberFormatIntrinsic
}

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
// ECMA-402 §18.1.1 step 17 constructs %Intl.PluralRules%.
// https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat
export function getPluralRulesIntrinsic(): typeof Intl.PluralRules {
  if (providerIntl === undefined) providerIntl = globalThis.Intl
  const registered = ownIntlProvider(formatterIntrinsicKeys.PluralRules)
  if (typeof registered === 'function')
    return registered as typeof Intl.PluralRules
  if (typeof pluralRulesProvider !== 'function')
    pluralRulesProvider = ownIntlProvider(
      'PluralRules'
    ) as typeof Intl.PluralRules
  return pluralRulesProvider
}

// Temporal comparison §§15.10.1–2 step4; §15.4.1: retain selected real parts methods.
// https://tc39.es/proposal-temporal/#sec-createdatetimeformat
const getFormatterPrototype = Object.getPrototypeOf
function formatterMethodLookup<T>(name: 'formatToParts' | 'select') {
  const methods = new WeakMap<object, T>()
  const owners = new WeakMap<object, T>()
  const getMethod = methods.get.bind(methods)
  const setMethod = methods.set.bind(methods)
  const getOwner = owners.get.bind(owners)
  const setOwner = owners.set.bind(owners)
  return (Constructor: object): T | undefined => {
    const cached = getMethod(Constructor)
    if (cached) return cached
    let prototype = getOwnPropertyDescriptor(Constructor, 'prototype')?.value
    while (prototype != null) {
      const inherited = getOwner(prototype)
      if (inherited) {
        setMethod(Constructor, inherited)
        return inherited
      }
      const descriptor = getOwnPropertyDescriptor(prototype, name)
      const value = descriptor && getOwnPropertyDescriptor(descriptor, 'value')
      if (value && typeof value.value === 'function') {
        const method = value.value as T
        setMethod(Constructor, method)
        setOwner(prototype, method)
        return method
      }
      prototype = getFormatterPrototype(prototype)
    }
  }
}
export const findFormatterPartsMethod: (Constructor: object) => unknown =
  formatterMethodLookup<unknown>('formatToParts')
export const findPluralRulesSelectMethod: (
  Constructor: object
) => Intl.PluralRules['select'] | undefined =
  formatterMethodLookup<Intl.PluralRules['select']>('select')
export function getFormatterPartsMethod<T>(Constructor: object): T {
  const method = findFormatterPartsMethod(Constructor)
  if (!method)
    throw new TypeErrorConstructor('Missing supplied formatter parts method')
  return method as T
}
if (typeof numberFormatProvider === 'function')
  findFormatterPartsMethod(numberFormatProvider)
if (typeof listFormatProvider === 'function')
  findFormatterPartsMethod(listFormatProvider)
if (typeof pluralRulesProvider === 'function')
  findPluralRulesSelectMethod(pluralRulesProvider)

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
const pluralRulesMemoizers = new WeakMap<
  typeof Intl.PluralRules,
  (locale: string) => Intl.PluralRules
>()
const getPluralRulesMemoizer =
  pluralRulesMemoizers.get.bind(pluralRulesMemoizers)
const setPluralRulesMemoizer =
  pluralRulesMemoizers.set.bind(pluralRulesMemoizers)

export function createMemoizedPluralRulesForConstructor(
  Constructor: typeof Intl.PluralRules
): (locale: string) => Intl.PluralRules {
  let factory = getPluralRulesMemoizer(Constructor)
  if (!factory) {
    factory = memoize(
      (locale: string) => new Constructor(locale),
      formatterMemoizeOptions
    )
    setPluralRulesMemoizer(Constructor, factory)
  }
  return factory
}

export function createMemoizedNumberFormatForConstructor(
  Constructor: typeof Intl.NumberFormat
): typeof createMemoizedNumberFormat {
  let factory = getNumberFormatMemoizer(Constructor)
  if (!factory) {
    factory = memoize(
      (...args: ConstructorParameters<typeof Intl.NumberFormat>) =>
        new Constructor(args[0], args[1]) as NumberFormatLike,
      formatterMemoizeOptions
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
      formatterMemoizeOptions
    )
    setListFormatMemoizer(Constructor, factory)
  }
  return factory
}
