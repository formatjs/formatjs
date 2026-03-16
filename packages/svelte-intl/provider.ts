import {type IntlShape} from '@formatjs/intl'
import {getContext, setContext} from 'svelte'
import {intlKey} from './context-key.js'

export function provideIntl(intl: IntlShape<string>): void {
  setContext(intlKey, intl)
}

export function useIntl(): IntlShape<string> {
  const intl = getContext<IntlShape<string>>(intlKey)
  if (!intl) {
    throw new Error(
      `An intl object was not provided. Use provideIntl in an ancestor component.`
    )
  }
  return intl
}
