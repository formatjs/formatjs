import {type IntlShape} from '@formatjs/intl'
import {
  inject,
  provide,
  type RendererElement,
  type RendererNode,
  type VNode,
} from 'vue'
import {intlKey} from './injection-key.js'

export function provideIntl(intl: IntlShape<VNode>): void {
  provide(intlKey, intl)
}

export function useIntl(): IntlShape<
  VNode<
    RendererNode,
    RendererElement,
    {
      [key: string]: any
    }
  >
> {
  const intl = inject<IntlShape<VNode>>(intlKey)
  if (!intl) {
    throw new Error(
      `An intl object was not injected. Install the plugin or use provideIntl.`
    )
  }
  return intl
}
