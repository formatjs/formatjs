import {defineComponent, h} from 'vue'
import {createIntl, intlKey, provideIntl, useIntl} from '../index'
import {mount} from '@vue/test-utils'
import {createIntl as rawCreateIntl} from '@formatjs/intl'

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
