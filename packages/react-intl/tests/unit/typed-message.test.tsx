import * as React from 'react'
import {expect, expectTypeOf, test} from 'vitest'
import {
  createIntl,
  defineMessage,
  type MessageTag,
  type MessageValue,
} from '#packages/react-intl/index.js'
import {
  defineMessage as serverMessage,
  createIntl as serverIntl,
} from '#packages/react-intl/server.js'

const intl = createIntl({locale: 'en'})
const message = defineMessage<{count: number | bigint}>(
  {id: 'items', defaultMessage: '{count, number}'},
  {typed: true}
)

test('typed helpers work through client and server entrypoints', () => {
  expect(intl.formatMessage(message, {count: 2})).toBe('2')
  const server = serverIntl({locale: 'en'})
  const descriptor = serverMessage<{name: MessageValue}>(
    {id: 'hello', defaultMessage: 'Hello {name}'},
    {typed: true}
  )
  expect(server.formatMessage(descriptor, {name: 'Ada'})).toBe('Hello Ada')
  const rich = defineMessage<{b: MessageTag}>(
    {id: 'rich', defaultMessage: '<b>Hello</b>'},
    {typed: true}
  )
  const result = intl.formatMessage(rich, {b: chunks => <b>{chunks}</b>})
  expect(React.isValidElement(result)).toBe(true)
  expect(
    React.isValidElement(intl.$t(rich, {b: chunks => <b>{chunks}</b>}))
  ).toBe(true)
})

function checkTypes() {
  expectTypeOf(intl.formatMessage(message, {count: 2})).toEqualTypeOf<string>()
  // @ts-expect-error Missing values cannot fall through to the legacy React overload.
  intl.formatMessage(message)
  // @ts-expect-error Wrong argument type.
  intl.formatMessage(message, {count: 'two'})
  // @ts-expect-error Wrong alias argument type.
  intl.$t(message, {count: 'two'})
  const rich = defineMessage<{b: MessageTag; value: MessageValue}>(
    {id: 'rich', defaultMessage: '<b>{value}</b>'},
    {typed: true}
  )
  expectTypeOf(
    intl.formatMessage(rich, {
      b: chunks => <b>{chunks}</b>,
      value: <i>Hello</i>,
    })
  ).toEqualTypeOf<React.ReactNode>()
  // @ts-expect-error A tag is not a string placeholder.
  intl.formatMessage(rich, {b: 'bold', value: 'hello'})
  // @ts-expect-error All placeholders, including tags, are required.
  intl.formatMessage(rich, {value: 'hello'})
  const server = serverIntl({locale: 'en'})
  // @ts-expect-error Server entrypoint enforces contracts too.
  server.formatMessage(message, {})
}
void checkTypes
