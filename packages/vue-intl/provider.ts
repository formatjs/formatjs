import {IntlShape} from '@formatjs/intl'
import {inject, provide, VNode} from 'vue'
import {intlKey} from './injection-key'

export function provideIntl(intl: IntlShape<VNode>) {
  provide(intlKey, intl)
}

export function useIntl() {
  const intl = inject<IntlShape<VNode>>(intlKey)
  if (!intl) {
    throw new Error(
      `An intl object was not injected. Install the plugin or use provideIntl.`
    )
  }
  return intl
}
