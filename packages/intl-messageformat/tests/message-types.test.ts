import type {UntypedMessageFormat} from '#packages/intl-messageformat/message-types.js'
import {expect, expectTypeOf, test} from 'vitest'
import {parse} from '@formatjs/icu-messageformat-parser'
import {
  IntlMessageFormat,
  type MessageTag,
  type NoMessageValues,
  type MessageValue,
} from '#packages/intl-messageformat/index.js'

const message = new IntlMessageFormat<{count: number | bigint}>(
  '{count, plural, one {# item} other {# items}}',
  'en'
)

test('typed ICU strings and ASTs use the same formatter', () => {
  expect(message.format({count: 2})).toBe('2 items')
  expect(message.formatToParts({count: 1n})).toEqual([
    {type: 0, value: '1 item'},
  ])
  const ast = new IntlMessageFormat<{name: MessageValue}>(
    parse('Hello {name}'),
    'en'
  )
  expect(ast.format({name: 'Ada'})).toBe('Hello Ada')
  const rich = new IntlMessageFormat<{b: MessageTag}>('<b>Hello</b>', 'en')
  expect(rich.format({b: chunks => chunks.join('').toUpperCase()})).toBe(
    'HELLO'
  )
  expect(
    rich.format<{children: unknown[]}>({b: chunks => ({children: chunks})})
  ).toEqual({children: ['Hello']})
  const format = message.format
  expect(format({count: 3})).toBe('3 items')
})

function checkTypes() {
  const namedEmpty = new IntlMessageFormat<NoMessageValues>('Hello')
  namedEmpty.format()
  namedEmpty.format({})
  namedEmpty.formatToParts()
  // @ts-expect-error Named empty contracts reject values.
  namedEmpty.format({extra: 1})
  // @ts-expect-error Parts enforce the same empty contract.
  namedEmpty.formatToParts({extra: 1})

  const optional = new IntlMessageFormat<{b?: MessageTag; count?: number}>(
    '<b>{count}</b>'
  )
  optional.format()
  optional.formatToParts()
  optional.format({b: chunks => chunks.join(''), count: 2})
  // @ts-expect-error Optional scalar arguments retain their type.
  optional.format({count: 'two'})
  // @ts-expect-error Optional tags still require callbacks.
  optional.format({b: 'bold'})

  const mixed = new IntlMessageFormat<{b?: MessageTag; count: number}>(
    '<b>{count}</b>'
  )
  mixed.format({count: 2})
  // @ts-expect-error Optional tags do not make required scalar values optional.
  mixed.format()
  // @ts-expect-error Required scalar values cannot be omitted from an object.
  mixed.format({b: chunks => chunks.join('')})
  // @ts-expect-error Typed messages require their values.
  message.format()
  // @ts-expect-error Parts enforce the same contract.
  message.formatToParts()
  // @ts-expect-error Count is numeric.
  message.format({count: 'two'})
  // @ts-expect-error Parts reject wrong value types too.
  message.formatToParts({count: false})
  // @ts-expect-error Explicit rich output types cannot weaken scalar arguments.
  message.format<string>({count: 'two'})
  // @ts-expect-error Missing count.
  message.format({})
  const empty = new IntlMessageFormat<{}>('Hello')
  empty.format()
  empty.formatToParts()
  // @ts-expect-error Empty messages have no arguments.
  empty.format({extra: true})
  const rich = new IntlMessageFormat<{b: MessageTag}>('<b>Hello</b>')
  // @ts-expect-error Tags need callbacks.
  rich.format({b: 'bold'})
  const union = new IntlMessageFormat<{name: MessageValue} | {count: number}>(
    '{name}'
  )
  // @ts-expect-error Values must cover each possible contract.
  union.format({name: 'Ada'})
  union.format({name: 'Ada', count: 2})
  const legacy = new IntlMessageFormat('{name}')
  expectTypeOf(legacy.format).toEqualTypeOf<UntypedMessageFormat>()
  legacy.format()
  legacy.format({name: 'Ada'})
}
void checkTypes
