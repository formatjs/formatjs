import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'

type LocaleBrandReader = (value: object) => string | undefined
interface ReaderNode {
  read: LocaleBrandReader
  next: ReaderNode | undefined
}
const apply = Reflect.apply
const defineProperty = Object.defineProperty
let readers: ReaderNode | undefined

// Setup only: snapshots share leaf readers, so independently bundled registries cannot cycle.
export function addLocaleBrandReader(read: LocaleBrandReader): void {
  if (typeof read !== 'function')
    throw new TypeErrorConstructor('Locale brand reader must be callable')
  for (let node = readers; node; node = node.next)
    if (node.read === read) return
  readers = {read, next: readers}
}

export function getLocaleBrandReaders(): readonly LocaleBrandReader[] {
  const result: LocaleBrandReader[] = []
  for (let node = readers; node; node = node.next)
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
  for (let node = readers; node; node = node.next) {
    const tag = node.read(value)
    if (typeof tag === 'string') return tag
  }
  return undefined
}

// Capture trusted realm access during setup; ordinary calls never inspect Intl.Locale.
const LocaleConstructor = typeof Intl === 'undefined' ? undefined : Intl.Locale
const snapshot = (
  LocaleConstructor as
    | (typeof Intl.Locale & {
        __getLocaleBrandReaders?: () => readonly LocaleBrandReader[]
      })
    | undefined
)?.__getLocaleBrandReaders
if (typeof snapshot === 'function') {
  const known = apply(
    snapshot,
    LocaleConstructor,
    []
  ) as readonly LocaleBrandReader[]
  for (let index = 0; index < known.length; index++)
    addLocaleBrandReader(known[index])
} else {
  const nativeToString = LocaleConstructor?.prototype.toString
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
