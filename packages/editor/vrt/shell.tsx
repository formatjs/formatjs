import {IntlProvider} from 'react-intl'
import type {ReactNode, ReactElement} from 'react'

/** The consumer owns document settings, providers, and design-system styles. */
export function EditorTestShell({
  children,
}: {
  children: ReactNode
}): ReactElement {
  return (
    <IntlProvider locale="en">
      <div lang="en" dir="ltr">
        {children}
      </div>
    </IntlProvider>
  )
}
