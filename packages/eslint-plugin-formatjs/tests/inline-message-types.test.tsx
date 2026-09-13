/* oxlint-disable typescript/consistent-type-imports -- Compile the rule's generated inline type imports verbatim. */
import * as React from 'react'
import {expect, expectTypeOf, test} from 'vitest'
import {createIntl as createCoreIntl} from '@formatjs/intl'
import {createIntl} from 'react-intl'

const core = createCoreIntl({locale: 'en'})
const intl = createIntl({locale: 'en'})

test('generated inline annotations keep formatting and rich callbacks intact', () => {
  expect(
    core.formatMessage(
      {
        id: 'count',
        defaultMessage: '{count, number}',
      } satisfies import('@formatjs/intl').MessageDescriptor as /* @formatjs-generated */ import('@formatjs/intl').TypedMessageDescriptor<{
        count: number | bigint
      }>,
      {count: 2}
    )
  ).toBe('2')
  const rich = intl.formatMessage(
    {
      id: 'rich',
      defaultMessage: '<b>{name}</b>',
    } satisfies import('react-intl').MessageDescriptor as /* @formatjs-generated */ import('react-intl').TypedMessageDescriptor<{
      b: import('react-intl').MessageTag
      name: import('react-intl').MessageValue
    }>,
    {b: chunks => <b>{chunks}</b>, name: 'Ada'}
  )
  expect(React.isValidElement(rich)).toBe(true)
  expectTypeOf(rich).toEqualTypeOf<React.ReactNode>()
})

function checkTypes() {
  type Count = import('@formatjs/intl').TypedMessageDescriptor<{n: number}>
  // @ts-expect-error Inline typed descriptors still require values.
  core.formatMessage({defaultMessage: '{n}'} as Count)
  // @ts-expect-error Inline values retain their numeric constraint.
  core.formatMessage({defaultMessage: '{n}'} as Count, {n: 'two'})
  core.formatMessage(
    {
      defaultMessage: '{n}',
    } satisfies import('@formatjs/intl').MessageDescriptor as import('@formatjs/intl').TypedMessageDescriptor<{
      n: number
    }>,
    {n: 1}
  )
  // @ts-expect-error Invalid descriptors cannot acquire the generated brand either.
  const invalid = {
    defaultMessage: 'Hello',
    // @ts-expect-error The satisfies check preserves descriptor validation.
    invalidProperty: true,
  } satisfies import('@formatjs/intl').MessageDescriptor as import('@formatjs/intl').TypedMessageDescriptor<{}>
  void invalid
}
void checkTypes
