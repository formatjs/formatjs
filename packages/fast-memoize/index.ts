//
// Main
//

type Func = (...args: any[]) => any

export interface Cache<K, V> {
  create: CacheCreateFunc<K, V>
}

interface CacheCreateFunc<K, V> {
  (): DefaultCache<K, V>
}

interface DefaultCache<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V): void
}

export type Serializer = (args: any[]) => string

export interface Options<F extends Func> {
  cache?: Cache<string, ReturnType<F>>
  serializer?: Serializer
  strategy?: MemoizeFunc<F>
}

export interface ResolvedOptions<F extends Func> {
  cache: Cache<string, ReturnType<F>>
  serializer: Serializer
}

export interface MemoizeFunc<F extends Func> {
  (fn: F, options?: Options<F>): F
}

export default function memoize<F extends Func>(fn: F, options?: Options<F>) {
  const cache = options && options.cache ? options.cache : cacheDefault

  const serializer =
    options && options.serializer ? options.serializer : serializerDefault

  const strategy =
    options && options.strategy ? options.strategy : strategyDefault

  return strategy(fn, {
    cache,
    serializer,
  })
}

//
// Strategy
//

function isPrimitive(value: any): boolean {
  return (
    value == null || typeof value === 'number' || typeof value === 'boolean'
  ) // || typeof value === "string" 'unsafe' primitive for our needs
}

export type StrategyFn = <F extends Func>(
  this: unknown,
  fn: F,
  cache: DefaultCache<string, ReturnType<F>>,
  serializer: Serializer,
  arg: any
) => any

function monadic<F extends Func>(
  this: unknown,
  fn: F,
  cache: DefaultCache<string, ReturnType<F>>,
  serializer: Serializer,
  arg: any
) {
  const cacheKey = isPrimitive(arg) ? arg : serializer(arg)

  let computedValue = cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    computedValue = fn.call(this, arg)
    cache.set(cacheKey, computedValue)
  }

  return computedValue
}

function variadic<F extends Func>(
  this: unknown,
  fn: F,
  cache: DefaultCache<string, ReturnType<F>>,
  serializer: Serializer
) {
  const args = Array.prototype.slice.call(arguments, 3)
  const cacheKey = serializer(args)

  let computedValue = cache.get(cacheKey)
  if (typeof computedValue === 'undefined') {
    computedValue = fn.apply(this, args)
    cache.set(cacheKey, computedValue)
  }

  return computedValue
}

function assemble<F extends Func>(
  fn: F,
  context: unknown,
  strategy: StrategyFn,
  cache: DefaultCache<string, ReturnType<F>>,
  serialize: Serializer
) {
  return strategy.bind(context, fn, cache, serialize)
}

function strategyDefault<F extends Func>(
  this: unknown,
  fn: F,
  options: ResolvedOptions<F>
) {
  const strategy = fn.length === 1 ? monadic : variadic

  return assemble(
    fn,
    this,
    strategy,
    options.cache.create(),
    options.serializer
  )
}

function strategyVariadic<F extends Func>(
  this: unknown,
  fn: F,
  options: ResolvedOptions<F>
) {
  return assemble(
    fn,
    this,
    variadic,
    options.cache.create(),
    options.serializer
  )
}

function strategyMonadic<F extends Func>(
  this: unknown,
  fn: F,
  options: ResolvedOptions<F>
) {
  return assemble(fn, this, monadic, options.cache.create(), options.serializer)
}

//
// Serializer
//

const serializerDefault: Serializer = function (): string {
  return JSON.stringify(arguments)
}

//
// Cache
//

function ObjectWithoutPrototypeCache(this: any) {
  this.cache = Object.create(null) as Record<string, any>
}

ObjectWithoutPrototypeCache.prototype.get = function (key: string) {
  return this.cache[key]
}

ObjectWithoutPrototypeCache.prototype.set = function <T>(
  key: string,
  value: T
): void {
  this.cache[key] = value
}

const cacheDefault: Cache<any, any> = {
  create: function create() {
    // @ts-ignore
    return new ObjectWithoutPrototypeCache()
  },
}

//
// API
//

export interface Strategies<F extends Func> {
  variadic: MemoizeFunc<F>
  monadic: MemoizeFunc<F>
}

export const strategies: Strategies<Func> = {
  variadic: strategyVariadic as MemoizeFunc<Func>,
  monadic: strategyMonadic as MemoizeFunc<Func>,
}
