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
    core.formatMessage<{readonly count: number | bigint}>(
      {id: 'count', defaultMessage: '{count, number}'},
      {count: 2}
    )
  ).toBe('2')
  const rich = intl.formatMessage<
    {
      readonly b: MessageTag
      readonly name: MessageValue
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
    readonly b?: MessageTag
    readonly count?: number | bigint
    readonly extra?: MessageValue
  }
  intl.$t<Ignored>({defaultMessage: '<b>{count, number}</b>'})
  intl.$t<Ignored>(
    {defaultMessage: '<b>{count, number}</b>'},
    {b: chunks => <b>{chunks}</b>, extra: 'allowed'}
  )
  // @ts-expect-error Optional numeric values still have numeric types.
  intl.$t<Ignored>({defaultMessage: '<b>{count, number}</b>'}, {count: 'two'})

  // @ts-expect-error Inline contracts require values.
  core.formatMessage<{readonly n: number}>({defaultMessage: '{n}'})
  // @ts-expect-error Inline values retain their numeric constraint.
  core.formatMessage<{readonly n: number}>({defaultMessage: '{n}'}, {n: 'two'})
  core.formatMessage<{readonly n: number}>({defaultMessage: '{n}'}, {n: 1})
  // @ts-expect-error Formatter signatures validate descriptor properties.
  core.formatMessage<{}>({
    defaultMessage: 'Hello',
    invalidProperty: true,
  })
}
void checkTypes

// Explicit declarations remain emit-safe with isolatedDeclarations enabled.
export const catalog: {
  readonly count: TypedMessageDescriptor<{readonly n: number | bigint}>
  readonly plain: TypedMessageDescriptor<{}>
} = defineMessages<{
  readonly count: {readonly n: number | bigint}
  readonly plain: {}
}>(
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
  // @ts-expect-error Generated catalog entries cannot be reassigned.
  catalog.count = {...catalog.count}
  const values: {readonly n: number | bigint} = {n: 2}
  // @ts-expect-error Generated argument properties cannot be reassigned.
  values.n = 3
  intl.formatMessage(catalog.count, values)
  const dynamicKey: string = 'count'
  // @ts-expect-error Generated catalogs no longer permit arbitrary string indexing.
  void catalog[dynamicKey]
}
void checkCatalogTypes
