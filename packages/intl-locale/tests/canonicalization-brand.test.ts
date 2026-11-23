import {readFileSync} from 'node:fs'
import {createContext, runInContext} from 'node:vm'
import {runfiles} from '@bazel/runfiles'
import {expect, it} from 'vitest'

const bundle = (name: string) =>
  readFileSync(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/packages/${name}/test262-polyfill.js`
    ),
    'utf8'
  )
const canonicalizer = bundle('intl-getcanonicallocales')
const locale = bundle('intl-locale')

it.each([
  ['canonicalizer,locale'],
  ['locale,canonicalizer'],
  ['canonicalizer,locale,canonicalizer'],
  ['locale,canonicalizer,locale'],
  ['canonicalizer,locale,locale,canonicalizer'],
])('preserves native and independent bundled Locale brands: %s', order => {
  const realm = createContext({})
  runInContext(
    'globalThis.values = [new Intl.Locale("en-US")]; globalThis.constructors = []',
    realm
  )
  let count = 0
  for (const module of order.split(',')) {
    runInContext(module === 'locale' ? locale : canonicalizer, realm)
    if (module === 'locale') {
      const tag = count++ === 0 ? 'de-DE' : 'fr-CA'
      runInContext(
        `values.push(new Intl.Locale('${tag}')); constructors.push(Intl.Locale)`,
        realm
      )
    }
  }
  const actual = runInContext(
    `(() => {
    const canonicalize = Intl.getCanonicalLocales;
    for (const value of values) Object.defineProperties(value, {
      toString: {get() { throw new Error('Visible Locale toString reached') }},
      length: {get() { throw new Error('Visible Locale length reached') }},
      [Symbol.toPrimitive]: {get() { throw new Error('Visible Locale coercion reached') }},
    });
    const fake = Object.create(constructors[0].prototype);
    Object.defineProperty(fake, 'toString', {value() { return 'it' }});
    for (const Constructor of constructors) Object.defineProperty(Constructor.prototype, 'toString', {
      configurable: true, get() { throw new Error('Replaced Locale prototype reached') },
    });
    Object.defineProperty(Intl, 'Locale', {configurable: true, get() {
      throw new Error('Replaced global Locale reached');
    }});
    WeakMap.prototype.get = () => { throw new Error('Replaced WeakMap lookup reached') };
    return [canonicalize(values), canonicalize([fake])];
  })()`,
    realm
  )
  expect(actual).toEqual([
    count === 1 ? ['en-US', 'de-DE'] : ['en-US', 'de-DE', 'fr-CA'],
    ['it'],
  ])
})
