import {IntlShape} from '@formatjs/intl'
import {inject, provide} from 'vue'

const IntlProvider = Symbol()

export function provideIntl(intl: IntlShape<string>) {
  provide(IntlProvider, intl)
}

export function useIntl() {
  const intl = inject<IntlShape<string>>(IntlProvider)
  if (!intl) {
    throw new Error(`provideIntl was not setup in this component's ancestor`)
  }
  return intl
}
