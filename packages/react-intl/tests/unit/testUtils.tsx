import * as React from 'react'
import Provider, {OptionalIntlConfig} from '../../src/components/provider'
import {render} from '@testing-library/react'

export function mountFormattedComponentWithProvider<P>(
  Comp: React.ComponentType<P>
) {
  return (
    props: P & {children?(...nodes: React.ReactNodeArray): React.ReactNode},
    providerProps: OptionalIntlConfig = {locale: 'en'}
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
        children?(...nodes: React.ReactNodeArray): React.ReactNode
      } = props,
      newProviderProps: OptionalIntlConfig = providerProps
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
