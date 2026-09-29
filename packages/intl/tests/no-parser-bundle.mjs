import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {rolldown} from 'rolldown'

const require = createRequire(import.meta.url)
const parser = '@formatjs/icu-messageformat-parser'
const noParserPath = require.resolve(`${parser}/no-parser.js`)

for (const withoutParser of [false, true]) {
  const build = await rolldown({
    cwd: import.meta.dirname,
    input: 'bundle-entry',
    platform: 'browser',
    transform: {define: {'process.env.NODE_ENV': JSON.stringify('production')}},
    resolve: {
      alias: withoutParser ? {[parser]: noParserPath} : {},
    },
    plugins: [
      {
        name: 'bundle-fixture',
        resolveId(id) {
          if (id === 'bundle-entry') return '\0bundle-entry'
        },
        load(id) {
          if (id === '\0bundle-entry') {
            return `
              export {createIntl} from '@formatjs/intl';
              export {IntlMessageFormat} from 'intl-messageformat';
            `
          }
        },
      },
    ],
  })
  try {
    const {output} = await build.generate({format: 'esm'})
    assert.equal(output.length, 1)
    const chunk = output[0]
    assert.equal(chunk.type, 'chunk')
    assert.deepEqual(chunk.imports, [])
    assert.deepEqual(chunk.dynamicImports, [])
    const modules = Object.keys(chunk.modules).map(id =>
      id.replaceAll('\\', '/')
    )
    assert.equal(
      modules.some(id => id.endsWith(`/${parser}/index.js`)),
      !withoutParser
    )
    assert.equal(
      modules.some(id => id.endsWith(`/${parser}/no-parser.js`)),
      withoutParser
    )
    if (withoutParser) {
      assert.ok(!modules.some(id => id.includes('icu-skeleton-parser')))
    }

    const {createIntl, IntlMessageFormat} = await import(
      `data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`
    )
    const message = [
      {type: 0, value: 'Hello, '},
      {type: 1, value: 'name'},
      {type: 0, value: '! '},
      {
        type: 6,
        value: 'count',
        pluralType: 'cardinal',
        offset: 0,
        options: {
          one: {value: [{type: 0, value: 'One item'}]},
          other: {value: [{type: 7}, {type: 0, value: ' items'}]},
        },
      },
    ]
    const intl = createIntl({
      locale: 'en',
      messages: {greeting: message},
      onError(error) {
        throw error
      },
    })
    assert.equal(
      intl.formatMessage({id: 'greeting'}, {name: 'Ada', count: 2}),
      'Hello, Ada! 2 items'
    )
    assert.equal(
      intl.formatMessage(
        {id: 'fallback', defaultMessage: message},
        {name: 'Ada', count: 1}
      ),
      'Hello, Ada! One item'
    )
    if (withoutParser) {
      assert.throws(
        () => new IntlMessageFormat('Hello, {name}!'),
        /uncompiled message/
      )
      assert.throws(
        () =>
          intl.formatMessage(
            {id: 'raw', defaultMessage: 'Hello, {name}!'},
            {name: 'Ada'}
          ),
        /uncompiled message/
      )
    } else {
      assert.equal(
        new IntlMessageFormat('Hello, {name}!').format({name: 'Ada'}),
        'Hello, Ada!'
      )
    }
  } finally {
    await build.close()
  }
}
