import * as React from 'react'
import IntlProvider from '../../../src/components/provider'
import withIntl from '../../../src/components/injectIntl'
import {render} from '@testing-library/react'
import {FormattedDate, FormattedMessage} from '../../../'
import type {IntlConfig} from '../../../src/types'

describe('<IntlProvider>', () => {
  const now = Date.now()

  class Child extends React.Component<any> {
    render() {
      return <span data-testid="foo">{'foo'}</span>
    }
  }

  const IntlChild = withIntl(Child)

  let dateNow: jest.SpyInstance

  beforeEach(() => {
    dateNow = jest.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    dateNow.mockRestore()
  })

  it('has a `displayName`', () => {
    expect(typeof IntlProvider.displayName).toBe('string')
  })

  it('warns when no `locale` prop is provided', () => {
    const onError = jest.fn()
    render(
      <IntlProvider
        // @ts-ignore
        locale={undefined}
        onError={onError}
      >
        <IntlChild />
      </IntlProvider>
    )

    expect(onError.mock.calls[0][0].code).toBe('INVALID_CONFIG')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('should re-render with new messages', () => {
    const onError = jest.fn()
    const props: IntlConfig = {
      locale: 'en',
      timeZone: 'Australia/Adelaide',
      formats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
      messages: {
        hello: 'Hello, World!',
      },

      defaultLocale: 'fr',
      defaultFormats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
      onError,
    }

    const {getByTestId, rerender} = render(
      <IntlProvider {...props}>
        <span data-testid="comp">
          <FormattedMessage id="hello" />
        </span>
      </IntlProvider>
    )

    expect(onError).not.toHaveBeenCalled()
    expect(getByTestId('comp')).toHaveTextContent('Hello, World!')
    rerender(
      <IntlProvider {...props} messages={{hello: 'blah'}}>
        <span data-testid="comp">
          <FormattedMessage id="hello" />
        </span>
      </IntlProvider>
    )
    expect(getByTestId('comp')).toHaveTextContent('blah')
  })

  it('warns when `locale` prop provided has no locale data in Intl.NumberFormat', () => {
    const locale = 'missing'
    const onError = jest.fn()
    render(
      <IntlProvider locale={locale} onError={onError}>
        <IntlChild />
      </IntlProvider>
    )

    expect(onError.mock.calls[0][0].code).toBe('MISSING_DATA')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('warns when `locale` prop provided has no locale data in Intl.DateTimeFormat', () => {
    const locale = 'xx-HA'
    const onError = jest.fn()
    const supportedLocalesOf = Intl.NumberFormat.supportedLocalesOf
    Intl.NumberFormat.supportedLocalesOf = (): string[] => ['xx-HA']
    render(
      <IntlProvider locale={locale} onError={onError}>
        <IntlChild />
      </IntlProvider>
    )

    expect(onError.mock.calls[0][0].code).toBe('MISSING_DATA')
    expect(onError).toHaveBeenCalledTimes(1)
    Intl.NumberFormat.supportedLocalesOf = supportedLocalesOf
  })

  it('renders its `children`', () => {
    const el = (
      <IntlProvider locale="en">
        <IntlChild />
      </IntlProvider>
    )

    const {container} = render(el)
    expect(container).toHaveTextContent('foo')
  })

  it('shadows inherited intl config props from an <IntlProvider> ancestor', () => {
    const onError = jest.fn()
    const props: IntlConfig = {
      locale: 'en',
      timeZone: 'Australia/Adelaide',
      formats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
      messages: {
        hello: 'Hello, World!',
      },

      defaultLocale: 'fr',
      defaultFormats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
      onError,
    }

    const {getByTestId} = render(
      <IntlProvider {...props}>
        <IntlProvider
          locale="fr"
          timeZone="Atlantic/Azores"
          formats={{}}
          messages={{}}
          defaultLocale="en"
          defaultFormats={{}}
          textComponent="span"
        >
          <span data-testid="comp">
            <FormattedDate value={new Date(2020, 1, 1)} timeZoneName="short" />
          </span>
        </IntlProvider>
      </IntlProvider>
    )

    expect(onError).not.toHaveBeenCalled()
    expect(getByTestId('comp')).toHaveTextContent('31/01/2020')
  })
  it('show warning for non-AST messages with defaultRichTextElements', () => {
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => null)

    render(
      <IntlProvider
        locale="fr"
        timeZone="Atlantic/Azores"
        formats={{}}
        messages={{
          foo: 'bar',
        }}
        defaultLocale="en"
        defaultFormats={{}}
        textComponent="span"
        defaultRichTextElements={{
          b: chunks => <b>{chunks}</b>,
        }}
      >
        <span data-testid="comp">
          <FormattedDate value={new Date(2020, 1, 1)} timeZoneName="short" />
        </span>
      </IntlProvider>
    )

    expect(consoleWarn)
      .toHaveBeenCalledWith(`[@formatjs/intl] "defaultRichTextElements" was specified but "message" was not pre-compiled.
Please consider using "@formatjs/cli" to pre-compile your messages for performance.
For more details see https://formatjs.io/docs/getting-started/message-distribution`)
  })
})
