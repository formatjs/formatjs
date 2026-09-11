import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {expect, test} from 'vitest'

const source = readFileSync(
  new URL('../locale-data/en.js', import.meta.url),
  'utf8'
)
const expected = JSON.parse(
  readFileSync(new URL('../cldr-raw/en.json', import.meta.url), 'utf8')
)

test('generated locale registers unchanged calendar data', () => {
  const registered: unknown[] = []
  runInNewContext(source, {
    Intl: {
      DateTimeFormat: {
        __addLocaleData(data: unknown) {
          registered.push(data)
        },
      },
    },
  })
  expect(registered).toHaveLength(1)
  expect(JSON.parse(JSON.stringify(registered[0]))).toEqual(expected)
})

test('generated locale queues unchanged calendar data before installation', () => {
  const queue: unknown[] = ['existing']
  runInNewContext(source, {Intl: {}, __FORMATJS_DATETIMEFORMAT_DATA__: queue})
  expect(queue).toHaveLength(2)
  expect(queue[0]).toBe('existing')
  expect(JSON.parse(JSON.stringify(queue[1]))).toEqual(expected)
})
