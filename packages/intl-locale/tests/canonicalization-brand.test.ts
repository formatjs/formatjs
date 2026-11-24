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
  ['locale,canonicalizer,locale,canonicalizer,locale'],
])('preserves native and independent bundled Locale brands: %s', order => {
  const realm = createContext({})
  runInContext(
    'globalThis.values = [new Intl.Locale("en-US")]; globalThis.constructors = []; globalThis.canonicalizers = []',
    realm
  )
  let count = 0
  for (const module of order.split(',')) {
    runInContext(module === 'locale' ? locale : canonicalizer, realm)
    runInContext('canonicalizers.push(Intl.getCanonicalLocales)', realm)
    if (module === 'locale') {
      const tag = ['de-DE', 'fr-CA', 'ja-JP'][count++]
      runInContext(
        `values.push(new Intl.Locale('${tag}')); constructors.push(Intl.Locale)`,
        realm
      )
    }
  }
  const actual = runInContext(
    `(() => {
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
    Object.defineProperty(Intl, 'getCanonicalLocales', {configurable: true, get() {
      throw new Error('Replaced global getCanonicalLocales reached');
    }});
    WeakMap.prototype.get = () => { throw new Error('Replaced WeakMap lookup reached') };
    return [
      canonicalizers.map(canonicalize => [
        canonicalize(values),
        canonicalize([fake]),
      ]),
      constructors.map(Constructor => [
        new Constructor(fake).baseName,
        ...values.map(value => {
          const copy = new Constructor(value, {numberingSystem: 'latn'});
          return [copy.baseName, copy.numberingSystem];
        }),
      ]),
    ];
  })()`,
    realm
  )
  const tags = ['en-US', 'de-DE', 'fr-CA', 'ja-JP'].slice(0, count + 1)
  expect(actual).toEqual([
    Array.from({length: order.split(',').length}, () => [tags, ['it']]),
    Array.from({length: count}, () => [
      'it',
      ...tags.map(tag => [tag, 'latn']),
    ]),
  ])
})
