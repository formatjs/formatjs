import * as React from 'react'
import FormattedMessage from '../../../src/components/message'
import IntlProvider, {createIntl} from '../../../src/components/provider'
import {mountFormattedComponentWithProvider} from '../testUtils'
import {IntlShape} from '../../../'
import {render} from '@testing-library/react'
import type {IntlConfig} from '../../../src/types'

const mountWithProvider = mountFormattedComponentWithProvider(FormattedMessage)

const dummyContext = React.createContext('')
const {Provider: DummyProvider, Consumer: DummyConsumer} = dummyContext

describe('<FormattedMessage>', () => {
  let providerProps: IntlConfig
  let intl: IntlShape

  beforeEach(() => {
    providerProps = {
      locale: 'en',
      defaultLocale: 'en',
      onError: () => {},
    }
    intl = createIntl(providerProps)
  })

  it('has a `displayName`', () => {
    expect(typeof FormattedMessage.displayName).toBe('string')
  })

  it('throws when <IntlProvider> is missing from ancestry and there is no defaultMessage', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FormattedMessage id="foo" />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('should not work if <IntlProvider> is missing from ancestry', () => {
    expect(() =>
      render(<FormattedMessage id="hello" defaultMessage="Hello" />)
    ).toThrow()
  })

  it('should work w/ multiple context', function () {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'hello world',
    }
    function Foo() {
      return (
        <DummyConsumer>
          {id => (
            <span data-testid="msg">
              <FormattedMessage data-testid="msg" id={id} />
            </span>
          )}
        </DummyConsumer>
      )
    }
    const {getByTestId} = render(
      <IntlProvider
        locale="en"
        messages={{
          [descriptor.id]: descriptor.defaultMessage,
        }}
      >
        <DummyProvider value={descriptor.id}>
          <Foo />
        </DummyProvider>
      </IntlProvider>
    )

    expect(getByTestId('msg')).toHaveTextContent(intl.formatMessage(descriptor))
  })

  it('renders a formatted message in a <>', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
    }
    const {getByTestId} = mountWithProvider(descriptor, providerProps)

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatMessage(descriptor)
    )
  })

  it('accepts `values` prop', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, {name}!',
    }
    const values = {name: 'Jest'}
    const {getByTestId} = mountWithProvider(
      {...descriptor, values},
      providerProps
    )

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatMessage(descriptor, values)
    )
  })

  it('accepts string as `tagName` prop', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
    }
    const tagName = 'p'

    const {container} = mountWithProvider(
      {...descriptor, tagName},
      providerProps
    )

    expect(container).toMatchSnapshot()
  })

  it('accepts an react element as `tagName` prop', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
    }

    const H1: React.FC<{children: React.ReactNode[]}> = ({children}) => (
      <h1 data-testid="h1">{children}</h1>
    )
    const {getByTestId} = mountWithProvider(
      {...descriptor, tagName: H1},
      providerProps
    )

    expect(getByTestId('h1').tagName).toBe('H1')
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatMessage(descriptor)
    )
  })

  it('should render out raw array if tagName is not specified', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
      tagName: '' as any,
    }

    const {getByTestId} = mountWithProvider(descriptor, {
      ...providerProps,
      textComponent: undefined,
    })

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatMessage(descriptor)
    )
  })

  it('supports function-as-child pattern', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
    }

    const spy = jest.fn().mockImplementation(() => <p>Jest</p>)

    const {getByTestId} = mountWithProvider(
      {...descriptor, children: spy},
      providerProps
    )

    expect(spy).toHaveBeenCalledTimes(2)

    expect(spy.mock.calls[0][0]).toEqual([intl.formatMessage(descriptor)])

    expect(getByTestId('comp')).toHaveTextContent('Jest')
  })

  describe('rich text', function () {
    it('supports legacy behavior', () => {
      const {getByTestId} = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, {name}!',
          values: {
            name: <b data-testid="b">Jest</b>,
          },
        },
        providerProps
      )

      const nameNode = getByTestId('b')
      expect(nameNode.tagName).toBe('B')
      expect(nameNode).toHaveTextContent('Jest')
    })
    it('supports rich-text message formatting', () => {
      const {getByTestId} = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, <b>{name}</b>!',
          values: {
            name: 'Jest',
            b: name => <b data-testid="b">{name}</b>,
          },
        },
        providerProps
      )

      const nameNode = getByTestId('b')
      expect(nameNode.tagName).toBe('B')
      expect(nameNode).toHaveTextContent('Jest')
    })
    it('supports rich-text message formatting with defaultRichTextElements', () => {
      const {getByTestId} = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, <b>{name}</b>!',
          values: {
            name: 'Jest',
          },
        },
        {
          ...providerProps,
          defaultRichTextElements: {
            b: chunks => <b data-testid="b">{chunks}</b>,
          },
        }
      )
      const nameNode = getByTestId('b')
      expect(nameNode.tagName).toBe('B')
      expect(nameNode).toHaveTextContent('Jest')
    })

    it('supports rich-text message formatting with defaultRichTextElements', () => {
      const {getByTestId} = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, <b>{name}</b>!',
          values: {
            name: 'Jest',
          },
          ignoreTag: true,
        },
        {
          ...providerProps,
        }
      )

      expect(getByTestId('comp')).toHaveTextContent('Hello, <b>Jest</b>!')
    })

    it('supports rich-text message formatting w/ nested tag', () => {
      const {getByTestId} = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, <b>{name}<i>!</i></b>',
          values: {
            name: 'Jest',
            b: chunks => <b>{chunks}</b>,
            i: msg => <i>{msg}</i>,
          },
        },
        providerProps
      )
      expect(getByTestId('comp')).toMatchSnapshot()
    })

    it('supports rich-text message formatting w/ nested tag, chunks merged', () => {
      const {getByTestId} = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, <b>{name}<i>!</i></b>',
          values: {
            name: 'Jest',
            b: (chunks: any) => <b>{chunks}</b>,
            i: msg => <i>{msg}</i>,
          },
        },
        providerProps
      )
      expect(getByTestId('comp')).toMatchSnapshot()
    })

    it('supports rich-text message formatting in function-as-child pattern', () => {
      const {getByTestId} = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, {name}',
          values: {
            name: <b data-testid="b">Jest</b>,
          },
          children: (chunks: any) => <strong>{chunks}</strong>,
        },
        providerProps
      )

      const nameNode = getByTestId('b')
      expect(nameNode.tagName).toBe('B')
      expect(nameNode).toHaveTextContent('Jest')
    })
  })
  it('should use timeZone from Provider', function () {
    const {getByTestId} = mountWithProvider(
      {
        id: 'hello',
        values: {
          ts: new Date(0),
        },
      },
      {
        ...providerProps,
        messages: {
          hello: 'Hello, {ts, date, short} - {ts, time, short}',
        },
        timeZone: 'Asia/Tokyo',
      }
    )

    expect(getByTestId('comp')).toHaveTextContent('Hello, 1/1/70 - 9:00 AM')
  })

  it('should use timeZone from Provider for defaultMessage', function () {
    const {getByTestId} = mountWithProvider(
      {
        id: 'hello',
        defaultMessage: 'Hello, {ts, date, short} - {ts, time, short}',
        values: {
          ts: new Date(0),
        },
      },
      {
        ...providerProps,
        timeZone: 'Asia/Tokyo',
      }
    )

    expect(getByTestId('comp')).toHaveTextContent('Hello, 1/1/70 - 9:00 AM')
  })

  it('should merge timeZone into formats', function () {
    const {getByTestId} = mountWithProvider(
      {
        id: 'hello',
        values: {
          ts: new Date(0),
        },
      },
      {
        ...providerProps,
        messages: {
          hello: 'Hello, {ts, date, short} - {ts, time, short}',
        },
        formats: {
          time: {
            short: {
              second: 'numeric',
              timeZoneName: 'long',
            },
          },
        },
        timeZone: 'Asia/Tokyo',
      }
    )

    expect(getByTestId('comp')).toHaveTextContent(
      'Hello, 1/1/70 - 9:00:00 AM Japan Standard Time'
    )
  })

  it('should merge timeZone into defaultFormats', function () {
    const {getByTestId} = mountWithProvider(
      {
        id: 'hello',
        defaultMessage: 'Hello, {ts, date, short} - {ts, time, short}',
        values: {
          ts: new Date(0),
        },
      },
      {
        ...providerProps,
        defaultFormats: {
          time: {
            short: {
              second: 'numeric',
              timeZoneName: 'long',
            },
          },
        },
        timeZone: 'Asia/Tokyo',
      }
    )

    expect(getByTestId('comp')).toHaveTextContent(
      'Hello, 1/1/70 - 9:00:00 AM Japan Standard Time'
    )
  })

  it('should handle defaultFormat merge correctly', function () {
    const {getByTestId} = mountWithProvider(
      {
        id: 'hello',
        defaultMessage: 'The day is {now, date, weekday-long}.',
        values: {
          now: new Date(0),
        },
      },
      {
        ...providerProps,
        defaultLocale: undefined,
        formats: {
          date: {
            'weekday-long': {weekday: 'long', timeZone: 'UTC'},
          },
          time: {
            hour: {hour: 'numeric'},
          },
        },
        defaultFormats: {
          date: {
            'weekday-long': {weekday: 'long'},
          },
          time: {
            hour: {hour: 'numeric'},
          },
        },
        timeZone: undefined,
      }
    )

    expect(getByTestId('comp')).toHaveTextContent('The day is Thursday.')
  })

  it('should handle defaultFormat merge correctly w/ timeZone', function () {
    const {getByTestId} = mountWithProvider(
      {
        id: 'hello',
        defaultMessage: 'The day is {now, date, weekday-long}.',
        values: {
          now: new Date(0),
        },
      },
      {
        ...providerProps,
        defaultLocale: undefined,
        formats: {
          date: {
            'weekday-long': {weekday: 'long', timeZone: 'UTC'},
          },
          time: {
            hour: {hour: 'numeric'},
          },
        },
        defaultFormats: {
          date: {
            'weekday-long': {weekday: 'long'},
          },
          time: {
            hour: {hour: 'numeric'},
          },
        },
        timeZone: 'Asia/Tokyo',
      }
    )

    expect(getByTestId('comp')).toHaveTextContent('The day is Thursday.')
  })

  it('should re-render when `values` are different', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, {name}!',
    }
    const values = {
      name: 'Jest',
    }

    const spy = jest.fn().mockImplementation(() => null)
    const {rerenderProps} = mountWithProvider(
      {
        ...descriptor,
        values,
        children: spy,
      },
      providerProps
    )

    expect(spy).toHaveBeenCalled()
    spy.mockClear()
    rerenderProps(
      {
        ...descriptor,
        values: {
          ...values, // create new object instance with same values to test shallow equality check
        },
        children: spy,
      },
      providerProps
    )
    expect(spy).not.toHaveBeenCalled()

    rerenderProps(
      {
        ...descriptor,
        values: {
          name: 'Enzyme',
        },
        children: spy,
      },
      providerProps
    )
    expect(spy).toHaveBeenCalled()
  })
})
