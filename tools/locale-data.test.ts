import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {test} from 'node:test'
import {runInNewContext} from 'node:vm'

interface LocaleData {
  locale: string
  data: {marker: string; fn?: (n: number) => string}
}

const apis = [
  'NumberFormat',
  'DisplayNames',
  'ListFormat',
  'RelativeTimeFormat',
  'PluralRules',
]

for (const [index, api] of apis.entries()) {
  test(`${api} emits one payload and preserves both loading paths`, () => {
    const dir = mkdtempSync(
      join(process.env.TEST_TMPDIR || tmpdir(), 'locale-')
    )
    const marker = 'locale-payload-marker'
    const plural = api === 'PluralRules'
    const sources = ['en', 'fr'].map(locale => {
      const payload = `{locale: '${locale}', data: {marker: '${marker}', ${
        plural ? "fn: function (n) { return n === 1 ? 'one' : 'other' }" : ''
      }}}`
      const input = join(dir, `${locale}.${plural ? 'js' : 'json'}`)
      writeFileSync(
        input,
        plural ? payload : JSON.stringify({locale, data: {marker}})
      )
      return input
    })
    const result = spawnSync(
      resolve(process.argv[index + 2]),
      sources.flatMap(input => ['--cldrFile', input]).concat('--outDir', dir),
      {encoding: 'utf8'}
    )
    assert.equal(result.status, 0, result.stderr || result.stdout)
    const scripts = ['en', 'fr'].map(locale => {
      assert.equal(
        readFileSync(join(dir, `${locale}.d.ts`), 'utf8'),
        'export {}'
      )
      const source = readFileSync(join(dir, `${locale}.js`), 'utf8')
      assert.equal(
        source.split(marker).length - 1,
        1,
        'payload must appear once'
      )
      return source
    })
    const queueName = `__FORMATJS_${api.toUpperCase()}_DATA__`
    for (const mode of ['register', 'missing', 'native', 'noncallable']) {
      const received: LocaleData[] = []
      const existing = {existing: true}
      const queue: unknown[] = [existing]
      const constructor =
        mode === 'register'
          ? {__addLocaleData: (data: LocaleData) => received.push(data)}
          : mode === 'noncallable'
            ? {__addLocaleData: true}
            : function Native() {}
      const context = {
        Intl: mode === 'missing' ? {} : {[api]: constructor},
        [queueName]: queue,
      }
      // Concatenation also catches missing separators and leaked global declarations.
      runInNewContext(scripts.concat(scripts[0]).join('\n'), context)
      const loaded = (
        mode === 'register' ? received : queue.slice(1)
      ) as LocaleData[]
      assert.deepEqual(
        loaded.map(data => data.locale),
        ['en', 'fr', 'en']
      )
      assert.deepEqual(
        JSON.parse(JSON.stringify(loaded)),
        ['en', 'fr', 'en'].map(locale => ({locale, data: {marker}}))
      )
      assert.equal(queue[0], existing)
      if (mode === 'register') assert.equal(queue.length, 1)
      if (plural) {
        for (const data of loaded) {
          assert.equal(data.data.fn!(1), 'one')
          assert.equal(data.data.fn!(2), 'other')
        }
      }
      assert.equal(Object.hasOwn(context, 'data'), false)
    }
    const fresh: Record<string, unknown> = {Intl: {}}
    runInNewContext(scripts.join('\n'), fresh)
    assert.deepEqual(
      Array.from(fresh[queueName] as LocaleData[], data => data.locale),
      ['en', 'fr']
    )
  })
}
