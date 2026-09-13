/* oxlint-disable typescript/consistent-type-imports -- Compile the rule's generated inline type imports verbatim. */
import * as React from 'react'
import {expect, expectTypeOf, test} from 'vitest'
import {createIntl as createCoreIntl} from '@formatjs/intl'
import {createIntl} from 'react-intl'

const core = createCoreIntl({locale: 'en'})
const intl = createIntl({locale: 'en'})

test('generated inline generics keep formatting and rich callbacks intact', () => {
  expect(
    core.formatMessage</* @formatjs-generated */ {count: number | bigint}>(
      {id: 'count', defaultMessage: '{count, number}'},
      {count: 2}
    )
  ).toBe('2')
  const rich = intl.formatMessage<
    /* @formatjs-generated */ {
      b: import('react-intl').MessageTag
      name: import('react-intl').MessageValue
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
    b?: import('react-intl').MessageTag
    count?: number | bigint
    extra?: import('react-intl').MessageValue
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
