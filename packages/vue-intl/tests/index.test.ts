import {defineComponent, h} from 'vue'
import {
  createIntl,
  defineMessage,
  defineMessages,
  intlKey,
  provideIntl,
  useIntl,
} from '#packages/vue-intl/index.js'
import {mount} from '@vue/test-utils'
import {createIntl as rawCreateIntl} from '@formatjs/intl'
import {expect, test} from 'vitest'

const Translations = defineComponent({
  template: `
  <div>
    <h2>
      {{
        $formatMessage({
          id: 'foo',
          defaultMessage: 'Hello',
        })
      }}
    </h2>
    <p>
      {{
        $formatNumber(123, {
          style: 'currency',
          currency: 'EUR',
        })
      }}
    </p>
  </div>
  `,
})

const Descendant = {
  setup() {
    const intl = useIntl()
    return () =>
      h(
        'p',
        {},
        intl.formatMessage({
          id: 'foo',
          defaultMessage: 'Hello',
        })
      )
  },
}

const Ancestor = {
  setup() {
    provideIntl(
      rawCreateIntl({
        locale: 'en',
        defaultLocale: 'en',
        messages: {
          foo: 'Composed',
        },
      })
    )
  },
  render() {
    return h(Descendant)
  },
}

const Injected = defineComponent({
  inject: {intl: intlKey},
  render() {
    return h(
      'p',
      {},
      // @ts-ignore
      this.intl.formatMessage({
        id: 'foo',
        defaultMessage: 'Hello',
      })
    )
  },
})

test('basic', function () {
  const wrapper = mount(Translations, {
    global: {
      plugins: [
        createIntl({
          locale: 'en',
          defaultLocale: 'en',
          messages: {
            foo: 'Foo',
          },
        }),
      ],
    },
  })

  expect(wrapper.text()).toBe('Foo€123.00')
})

test('injected', function () {
  const wrapper = mount(Injected, {
    global: {
      plugins: [
        createIntl({
          locale: 'en',
          defaultLocale: 'en',
          messages: {
            foo: 'Injected',
          },
        }),
      ],
    },
  })

  expect(wrapper.text()).toBe('Injected')
})

test('composition', function () {
  const wrapper = mount(Ancestor)

  expect(wrapper.text()).toBe('Composed')
})

test('typed helpers preserve contracts and readonly descriptors', () => {
  const source = {id: 'typed', defaultMessage: '{count, number}'}
  const message = defineMessage<{readonly count: number}>(source, {typed: true})
  expect(message).toBe(source)
  const catalog = defineMessages<{item: {readonly count: number}}>(
    {item: source},
    {typed: true}
  )
  expect(catalog.item).toBe(source)
  const plain = defineMessages({item: source})
  expect(plain.item).toBe(source)

  // TypeScript checks this function without executing invalid mutations.
  function assertTypes() {
    // @ts-expect-error descriptors are readonly
    message.id = 'changed'
    // @ts-expect-error catalog entries are readonly
    catalog.item = message
    // @ts-expect-error untyped descriptors are readonly too
    plain.item.defaultMessage = 'changed'
    const intl = rawCreateIntl({locale: 'en'})
    intl.formatMessage(message, {count: 1})
    intl.formatMessage(catalog.item, {count: 1})
    // @ts-expect-error required values cannot be omitted
    intl.formatMessage(message)
    // @ts-expect-error numeric arguments reject strings
    intl.formatMessage(catalog.item, {count: 'one'})
  }
  expect(assertTypes).toBeTypeOf('function')
})
