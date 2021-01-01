import {defineComponent, h} from 'vue';
import VueIntl from '../index';
import {mount} from '@vue/test-utils';

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
});

const Injected = defineComponent({
  inject: ['intl'],
  render() {
    return h(
      'p',
      {},
      // @ts-ignore
      this.intl.formatMessage({
        id: 'foo',
        defaultMessage: 'Hello',
      })
    );
  },
});

test('basic', function () {
  // @ts-ignore
  const wrapper = mount(Translations, {
    global: {
      plugins: [
        [
          VueIntl,
          {
            locale: 'en',
            defaultLocale: 'en',
            messages: {
              foo: 'Foo',
            },
          },
        ],
      ],
    },
  });

  expect(wrapper.text()).toBe('Foo€123.00');
});

test('injected', function () {
  // @ts-ignore
  const wrapper = mount(Injected, {
    global: {
      plugins: [
        [
          VueIntl,
          {
            locale: 'en',
            defaultLocale: 'en',
            messages: {
              foo: 'Injected',
            },
          },
        ],
      ],
    },
  });

  expect(wrapper.text()).toBe('Injected');
});
