import * as React from 'react'
import Provider from '../../src/components/provider'
import {render} from '@testing-library/react'
import type {IntlConfig} from '../../src/types'

export function mountFormattedComponentWithProvider<P>(
  Comp: React.ComponentType<P>
) {
  return (
    props: P & {children?(nodes: React.ReactNode[]): React.ReactNode},
    providerProps: IntlConfig = {locale: 'en'}
  ) => {
    const result = render(
      <React.StrictMode>
        <Provider {...providerProps}>
          <span data-testid="comp">
            <Comp {...props} />
          </span>
        </Provider>
      </React.StrictMode>
    )

    const {rerender} = result
    const rerenderProps = (
      newProps: P & {
        children?(nodes: React.ReactNode[]): React.ReactNode
      } = props,
      newProviderProps: IntlConfig = providerProps
    ) =>
      rerender(
        <React.StrictMode>
          <Provider {...newProviderProps}>
            <span data-testid="comp">
              <Comp {...newProps} />
            </span>
          </Provider>
        </React.StrictMode>
      )

    return {...result, rerenderProps}
  }
}
