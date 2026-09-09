import {IntlProvider} from 'react-intl'
import type {ReactNode, ReactElement} from 'react'

/** The consumer owns document settings, providers, and design-system styles. */
export function EditorTestShell({
  children,
  direction = 'ltr',
}: {
  children: ReactNode
  direction?: 'ltr' | 'rtl'
}): ReactElement {
  return (
    <IntlProvider locale="en">
      <div lang="en" dir={direction}>
        {children}
      </div>
    </IntlProvider>
  )
}
