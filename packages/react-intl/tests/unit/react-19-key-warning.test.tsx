import {render} from '@testing-library/react'
import * as React from 'react'
import FormattedMessage from '../../src/components/message'
import IntlProvider from '../../src/components/provider'
import type {IntlConfig} from '../../src/types'
import {describe, expect, it, beforeEach, vi, afterEach} from 'vitest'
import '@testing-library/jest-dom/vitest'

describe('React 19 Key Warning Issue #5135', () => {
  let providerProps: IntlConfig
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    providerProps = {
      locale: 'en',
      defaultLocale: 'en',
      onError: () => {},
    }
    // Spy on console.error to catch React warnings (React logs warnings to console.error)
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should not produce React 19 key warnings when using React elements as format argument values', () => {
    const {container} = render(
      <IntlProvider {...providerProps}>
        <FormattedMessage
          id="example"
          defaultMessage="hello {test}"
          values={{test: <span>world</span>}}
        />
      </IntlProvider>
    )

    expect(container).toHaveTextContent('hello world')

    // Check for React key warnings
    const keyWarnings = consoleErrorSpy.mock.calls.filter((call: any[]) =>
      call.some((arg: any) => typeof arg === 'string' && arg.includes('key'))
    )

    expect(keyWarnings.length).toBe(0)
  })

  it('should not produce React 19 key warnings with rich text formatting using tag functions', () => {
    const {container} = render(
      <IntlProvider {...providerProps}>
        <FormattedMessage
          id="example"
          defaultMessage="Lorem <b>ipsum</b>"
          values={{b: (chunks: React.ReactNode) => <span>{chunks}</span>}}
        />
      </IntlProvider>
    )

    expect(container).toHaveTextContent('Lorem ipsum')

    // Check for React key warnings
    const keyWarnings = consoleErrorSpy.mock.calls.filter((call: any[]) =>
      call.some((arg: any) => typeof arg === 'string' && arg.includes('key'))
    )

    expect(keyWarnings.length).toBe(0)
  })

  it('should not produce React 19 key warnings with nested rich text tags', () => {
    const {container} = render(
      <IntlProvider {...providerProps}>
        <FormattedMessage
          id="example"
          defaultMessage="Hello, <b>{name}<i>!</i></b>"
          values={{
            name: 'Jest',
            b: (chunks: React.ReactNode) => <b>{chunks}</b>,
            i: (msg: React.ReactNode) => <i>{msg}</i>,
          }}
        />
      </IntlProvider>
    )

    expect(container).toHaveTextContent('Hello, Jest!')

    // Check for React key warnings
    const keyWarnings = consoleErrorSpy.mock.calls.filter((call: any[]) =>
      call.some((arg: any) => typeof arg === 'string' && arg.includes('key'))
    )

    expect(keyWarnings.length).toBe(0)
  })

  it('should not produce React 19 key warnings with defaultRichTextElements', () => {
    const {container} = render(
      <IntlProvider
        {...providerProps}
        defaultRichTextElements={{
          b: (chunks: React.ReactNode) => <b>{chunks}</b>,
        }}
      >
        <FormattedMessage
          id="example"
          defaultMessage="Hello, <b>{name}</b>!"
          values={{name: 'Jest'}}
        />
      </IntlProvider>
    )

    expect(container).toHaveTextContent('Hello, Jest!')

    // Check for React key warnings
    const keyWarnings = consoleErrorSpy.mock.calls.filter((call: any[]) =>
      call.some((arg: any) => typeof arg === 'string' && arg.includes('key'))
    )

    expect(keyWarnings.length).toBe(0)
  })

  it('should not produce React 19 key warnings with multiple React element values', () => {
    const {container} = render(
      <IntlProvider {...providerProps}>
        <FormattedMessage
          id="example"
          defaultMessage="Click {button} or {link}"
          values={{
            button: <button>here</button>,
            link: <a href="#">there</a>,
          }}
        />
      </IntlProvider>
    )

    expect(container).toHaveTextContent('Click here or there')

    // Check for React key warnings
    const keyWarnings = consoleErrorSpy.mock.calls.filter((call: any[]) =>
      call.some((arg: any) => typeof arg === 'string' && arg.includes('key'))
    )

    expect(keyWarnings.length).toBe(0)
  })
})
