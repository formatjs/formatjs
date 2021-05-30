import {IntlShape} from '@formatjs/intl'
import {inject, provide} from 'vue'
import {intlKey} from './injection-key'

export function provideIntl(intl: IntlShape<string>) {
  provide(intlKey, intl)
}

export function useIntl() {
  const intl = inject<IntlShape<string>>(intlKey)
  if (!intl) {
    throw new Error(
      `An intl object was not injected. Install the plugin or use provideIntl.`
    )
  }
  return intl
}
