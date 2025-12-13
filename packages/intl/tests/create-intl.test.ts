import {expect, test, vi} from 'vitest'
import {createIntl} from '../src/create-intl'

test('createIntl', function () {
  const intl = createIntl({
    locale: 'en',
    messages: {
      foo: 'bar',
    },
  })
  expect(
    intl.formatMessage({
      id: 'foo',
    })
  ).toBe('bar')
})

test('should warn when defaultRichTextElements is used with messages', function () {
  const onWarn = vi.fn()
  createIntl({
    locale: 'en',
    messages: {
      foo: 'bar',
    },
    defaultRichTextElements: {},
    onWarn,
  })
  expect(onWarn).toHaveBeenCalledWith(
    expect.stringContaining(
      `defaultRichTextElements" was specified but "message" was not pre-compiled.`
    )
  )
})

test('should not warn when defaultRichTextElements is not used', function () {
  const onWarn = vi.fn()
  createIntl({
    locale: 'en',
    messages: {
      foo: 'bar',
    },
    onWarn,
  })
  expect(onWarn).not.toHaveBeenCalled()
})

test('should use the default warn handler when none is passed', function () {
  const warnFn = vi.spyOn(console, 'warn')
  createIntl({
    locale: 'en',
    messages: {
      foo: 'bar',
    },
    defaultRichTextElements: {},
  })
  expect(warnFn).toHaveBeenCalledWith(
    expect.stringContaining(
      `defaultRichTextElements" was specified but "message" was not pre-compiled.`
    )
  )
})
