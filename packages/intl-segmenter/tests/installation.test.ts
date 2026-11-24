import {readFileSync} from 'node:fs'
import {createContext, runInContext} from 'node:vm'
import {runfiles} from '@bazel/runfiles'
import {expect, it} from 'vitest'

it('installs segment iterators with the intrinsic prototype', () => {
  const source = readFileSync(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/packages/intl-segmenter/test262-polyfill.js`
    ),
    'utf8'
  )
  const realm = createContext({})
  runInContext(
    `const arrayIterator = Array.prototype[Symbol.iterator];
    const iteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(arrayIterator.call([])));
    Array.prototype[Symbol.iterator] = function () {
      if (this.length === 0) throw new Error('unexpected empty array iteration');
      return arrayIterator.call(this);
    };`,
    realm
  )
  runInContext(source, realm)
  expect(
    runInContext(
      `const cursor = new Intl.Segmenter('en').segment('a')[Symbol.iterator]();
      Object.getPrototypeOf(Object.getPrototypeOf(cursor)) === iteratorPrototype
        && cursor.next().value.segment === 'a';`,
      realm
    )
  ).toBe(true)
})
