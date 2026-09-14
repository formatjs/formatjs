import * as React from 'react'
import {expect, expectTypeOf, test} from 'vitest'
import {createIntl as createCoreIntl} from '@formatjs/intl'
import {
  createIntl,
  defineMessages,
  type TypedMessageDescriptor,
  type MessageTag,
  type MessageValue,
} from 'react-intl'

const core = createCoreIntl({locale: 'en'})
const intl = createIntl({locale: 'en'})

test('generated inline generics keep formatting and rich callbacks intact', () => {
  expect(
    core.formatMessage<{count: number | bigint}>(
      {id: 'count', defaultMessage: '{count, number}'},
      {count: 2}
    )
  ).toBe('2')
  const rich = intl.formatMessage<
    {
      b: MessageTag
      name: MessageValue
    },
    React.ReactNode
  >(
    {id: 'rich', defaultMessage: '<b>{name}</b>'},
    {b: chunks => <b>{chunks}</b>, name: 'Ada'}
  )
  expect(React.isValidElement(rich)).toBe(true)
  expectTypeOf(rich).toMatchTypeOf<React.ReactNode>()
})

function checkTypes() {
  type Ignored = {
    b?: MessageTag
    count?: number | bigint
    extra?: MessageValue
  }
  intl.$t<Ignored>({defaultMessage: '<b>{count, number}</b>'})
  intl.$t<Ignored>(
    {defaultMessage: '<b>{count, number}</b>'},
    {b: chunks => <b>{chunks}</b>, extra: 'allowed'}
  )
  // @ts-expect-error Optional numeric values still have numeric types.
  intl.$t<Ignored>({defaultMessage: '<b>{count, number}</b>'}, {count: 'two'})

  // @ts-expect-error Inline contracts require values.
  core.formatMessage<{n: number}>({defaultMessage: '{n}'})
  // @ts-expect-error Inline values retain their numeric constraint.
  core.formatMessage<{n: number}>({defaultMessage: '{n}'}, {n: 'two'})
  core.formatMessage<{n: number}>({defaultMessage: '{n}'}, {n: 1})
  core.formatMessage<{}>({
    defaultMessage: 'Hello',
    // @ts-expect-error Formatter signatures validate descriptor properties.
    invalidProperty: true,
  })
}
void checkTypes

// Explicit declarations remain emit-safe with isolatedDeclarations enabled.
export const catalog: {
  count: TypedMessageDescriptor<{n: number | bigint}>
  plain: TypedMessageDescriptor<{}>
} = defineMessages<{count: {n: number | bigint}; plain: {}}>(
  {
    count: {id: 'catalog-count', defaultMessage: '{n, number}'},
    plain: {id: 'catalog-plain', defaultMessage: 'Hello'},
  },
  {typed: true}
)

test('annotated catalogs preserve per-message argument checks', () => {
  expect(intl.formatMessage(catalog.count, {n: 2})).toBe('2')
  expect(intl.formatMessage(catalog.plain)).toBe('Hello')
})

function checkCatalogTypes() {
  // @ts-expect-error Known catalog messages cannot omit required arguments.
  intl.formatMessage(catalog.count)
  // @ts-expect-error Broad descriptor annotations cannot hide incorrect values.
  intl.formatMessage(catalog.count, {n: 'two'})
  // @ts-expect-error Generated catalog keys reject unknown names.
  void catalog.missing
  const dynamicKey: string = 'count'
  // @ts-expect-error Generated catalogs no longer permit arbitrary string indexing.
  void catalog[dynamicKey]
}
void checkCatalogTypes
