import * as React from 'react'
import {useIntl, IntlProvider as IntlProvider_} from '../..'
import {PrimitiveType} from 'intl-messageformat'

// "import type" ensures en messages aren't bundled by default
import type sourceOfTruth from './en.json'
// Note: in order to use "import type" you'll need Babel >= 7.9.0 and/or TypeScript >= 3.8.
// Otherwise, you can use a normal import and accept to always bundle one language + the user required one

export type LocaleMessages = typeof sourceOfTruth
export type LocaleKey = keyof LocaleMessages

export function useFormatMessage(): (
  id: LocaleKey, // only accepts valid keys, not any string
  values?: Record<string, PrimitiveType>
) => string {
  const intl = useIntl()
  return (id, values) => intl.formatMessage({id}, values)
}

type SupportedLocales = 'en' | 'it'

// return type on this signature enforces that all languages have the same translations defined
export function importMessages(
  locale: SupportedLocales
): Promise<LocaleMessages> {
  switch (locale) {
    case 'en':
      return import('./en.json')
    case 'it':
      return import('./it.json')
  }
}

export const IntlProvider: React.FC<
  Omit<React.ComponentProps<typeof IntlProvider_>, 'messages'> & {
    messages: LocaleMessages
  }
> = props => <IntlProvider_ {...props} />
