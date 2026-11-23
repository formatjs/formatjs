import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'

type LocaleBrandReader = (value: object) => string | undefined
interface ReaderNode {
  read: LocaleBrandReader
  next: ReaderNode | undefined
}
interface ReaderRegistry {
  readers: ReaderNode | undefined
  parent: ReaderRegistry | undefined
}
interface BrandProvider {
  __localeBrandRegistry?: ReaderRegistry
  __getLocaleBrandReaders?: () => readonly LocaleBrandReader[]
}
const apply = Reflect.apply
const defineProperty = Object.defineProperty
export const localeBrandRegistry: ReaderRegistry = {
  readers: undefined,
  parent: undefined,
}

function rootRegistry(registry: ReaderRegistry): ReaderRegistry {
  while (registry.parent) registry = registry.parent
  return registry
}

export function addLocaleBrandReader(read: LocaleBrandReader): void {
  if (typeof read !== 'function')
    throw new TypeErrorConstructor('Locale brand reader must be callable')
  const registry = rootRegistry(localeBrandRegistry)
  for (let node = registry.readers; node; node = node.next)
    if (node.read === read) return
  registry.readers = {read, next: registry.readers}
}

// Joining roots keeps saved constructors and canonicalizers aware of later bundles.
export function connectLocaleBrandReaders(other: ReaderRegistry): void {
  const ownRoot = rootRegistry(localeBrandRegistry)
  const otherRoot = rootRegistry(other)
  if (ownRoot === otherRoot) return
  const readers = ownRoot.readers
  ownRoot.parent = otherRoot
  ownRoot.readers = undefined
  for (let node = readers; node; node = node.next)
    addLocaleBrandReader(node.read)
}

export function getLocaleBrandReaders(): readonly LocaleBrandReader[] {
  const result: LocaleBrandReader[] = []
  for (
    let node = rootRegistry(localeBrandRegistry).readers;
    node;
    node = node.next
  )
    defineProperty(result, result.length, {
      value: node.read,
      writable: true,
      enumerable: true,
      configurable: true,
    })
  return result
}

export function localeString(value: unknown): string | undefined {
  if (!IsObject(value)) return undefined
  for (
    let node = rootRegistry(localeBrandRegistry).readers;
    node;
    node = node.next
  ) {
    const tag = node.read(value)
    if (typeof tag === 'string') return tag
  }
  return undefined
}

// Capture trusted realm access during setup; ordinary calls never inspect Intl.Locale.
const intl = typeof Intl === 'undefined' ? undefined : Intl
const currentCanonicalizer = intl?.getCanonicalLocales as
  | BrandProvider
  | undefined
const currentLocale = intl?.Locale as
  | (typeof Intl.Locale & BrandProvider)
  | undefined
if (currentCanonicalizer?.__localeBrandRegistry)
  connectLocaleBrandReaders(currentCanonicalizer.__localeBrandRegistry)
const snapshot = currentLocale?.__getLocaleBrandReaders
if (currentLocale?.__localeBrandRegistry) {
  connectLocaleBrandReaders(currentLocale.__localeBrandRegistry)
} else if (typeof snapshot === 'function') {
  const known = apply(
    snapshot,
    currentLocale,
    []
  ) as readonly LocaleBrandReader[]
  for (let index = 0; index < known.length; index++)
    addLocaleBrandReader(known[index])
} else {
  const nativeToString = currentLocale?.prototype.toString
  if (typeof nativeToString === 'function') {
    addLocaleBrandReader(value => {
      try {
        const tag = apply(nativeToString, value, [])
        return typeof tag === 'string' ? tag : undefined
      } catch {
        return undefined
      }
    })
  }
}
