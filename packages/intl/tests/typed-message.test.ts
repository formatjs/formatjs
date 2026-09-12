import {expect, expectTypeOf, test} from 'vitest'
import {
  createIntl,
  defineMessage,
  defineMessages,
  type MessageTag,
  type MessageValue,
} from '#packages/intl/index.js'

const intl = createIntl({locale: 'en'})
const message = defineMessage<{count: number | bigint}>(
  {
    id: 'count',
    defaultMessage: '{count, plural, one {# item} other {# items}}',
  },
  {typed: true}
)

test('typed descriptors remain ordinary descriptors at runtime', () => {
  expect(Object.keys(message)).toEqual(['id', 'defaultMessage'])
  expect(intl.formatMessage(message, {count: 2})).toBe('2 items')
  expect(intl.$t(message, {count: 1n})).toBe('1 item')
  const tag = defineMessage<{b: MessageTag; name: MessageValue}>(
    {id: 'rich', defaultMessage: '<b>{name}</b>'},
    {typed: true}
  )
  expect(
    intl.formatMessage(tag, {
      b: chunks => chunks.join('').toUpperCase(),
      name: 'hello',
    })
  ).toBe('HELLO')
  const catalog = defineMessages<{hello: {}; total: {n: number | bigint}}>(
    {
      hello: {id: 'hello', defaultMessage: 'Hello'},
      total: {id: 'total', defaultMessage: '{n, number}'},
    },
    {typed: true}
  )
  expect(intl.formatMessage(catalog.hello)).toBe('Hello')
  expect(intl.formatMessage(catalog.total, {n: 12})).toBe('12')
})

// Compiled by the Bazel test typecheck, never executed.
function checkTypes() {
  expectTypeOf(intl.formatMessage(message, {count: 1})).toEqualTypeOf<string>()
  // @ts-expect-error Typed descriptors cannot use the permissive overload.
  intl.formatMessage(message)
  // @ts-expect-error Missing count.
  intl.formatMessage(message, {})
  // @ts-expect-error Numeric placeholders reject strings.
  intl.formatMessage(message, {count: '2'})
  // @ts-expect-error The alias checks the same contract.
  intl.$t(message, {count: false})
  const wrongValues = {count: 'two'}
  // @ts-expect-error Reused value maps cannot infer a weaker contract.
  intl.formatMessage(message, wrongValues)
  const format = intl.formatMessage
  // @ts-expect-error Detached formatter retains the contract.
  format(message, wrongValues)
  // @ts-expect-error Fresh object literals reject unused values.
  intl.formatMessage(message, {count: 2, extra: true})
  const named = defineMessage<{name: MessageValue}>(
    {id: 'named', defaultMessage: '{name}'},
    {typed: true}
  )
  const selected = Math.random() ? message : named
  // @ts-expect-error Union descriptors still require values.
  intl.formatMessage(selected)
  // @ts-expect-error Values must cover every possible descriptor.
  intl.formatMessage(selected, {count: 2})
  intl.formatMessage(selected, {count: 2, name: 'Ada'})
  const empty = defineMessage<{}>(
    {id: 'empty', defaultMessage: 'Hello'},
    {typed: true}
  )
  // @ts-expect-error A message without placeholders accepts no values.
  intl.formatMessage(empty, {extra: 2})
  const date = defineMessage<{now: number | Date}>(
    {id: 'date', defaultMessage: '{now, date}'},
    {typed: true}
  )
  intl.formatMessage(date, {now: new Date()})
  // @ts-expect-error Dates do not accept strings.
  intl.formatMessage(date, {now: 'today'})
  const tag = defineMessage<{b: MessageTag}>(
    {id: 'rich', defaultMessage: '<b>Hello</b>'},
    {typed: true}
  )
  const richIntl = createIntl<{children: unknown[]}>({locale: 'en'})
  richIntl.formatMessage(tag, {b: chunks => ({children: chunks})})
  richIntl.$t(tag, {b: chunks => ({children: chunks})})
  // @ts-expect-error Tags require callbacks.
  intl.formatMessage(tag, {b: 'bold'})
  const legacy = defineMessage<{id: 'legacy'; defaultMessage: string}>({
    id: 'legacy',
    defaultMessage: '{anything}',
  })
  expectTypeOf(legacy.id).toEqualTypeOf<'legacy'>()
  intl.formatMessage(legacy)
  intl.formatMessage(legacy, {anything: 'still permissive'})
}
void checkTypes
