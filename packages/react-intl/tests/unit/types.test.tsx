import * as React from 'react'
import {defineMessages, injectIntl, type IntlShape, useIntl} from '../../'
import {describe, it} from 'vitest'
describe('types', () => {
  // https://github.com/formatjs/formatjs/issues/3856
  it('works with react18 typing', () => {
    function Test() {
      const messages = defineMessages({
        greeting: {
          id: 'app.greeting',
          defaultMessage: 'Hello, <bold>{name}</bold>!',
          description: 'Greeting to welcome the user to the app',
        },
      })

      const intl = useIntl()

      return intl.formatMessage(messages.greeting, {
        name: 'Eric',
        bold: chunks => <b>{chunks}</b>,
      })
    }

    // This test only need to pass the type checking.
    ;<Test />
  })

  it('works with string value types', () => {
    function Test() {
      const messages = defineMessages({
        greeting: {
          id: 'app.greeting',
          defaultMessage: 'Hello, {name}!',
          description: 'Greeting to welcome the user to the app',
        },
      })

      const intl = useIntl()

      const result = intl.formatMessage(messages.greeting, {
        name: 'Eric',
      })
      // This is to make sure result is a string
      result.charCodeAt(0)
      return <>{result}</>
    }

    // This test only need to pass the type checking.
    ;<Test />
  })

  it('works with callback value types', () => {
    function Test() {
      const messages = defineMessages({
        greeting: {
          id: 'app.greeting',
          defaultMessage: 'Hello, <bold>name</bold>!',
          description: 'Greeting to welcome the user to the app',
        },
      })

      const intl = useIntl()

      const result = intl.formatMessage(messages.greeting, {
        bold: chunks => <b>{chunks}</b>,
      })
      return <>{result}</>
    }

    // This test only need to pass the type checking.
    ;<Test />
  })

  it('injectIntl works with union prop types', () => {
    type TestProps = {intl: IntlShape; base: string} & (
      | {type: 'a'; text: string}
      | {type: 'b'; value: number}
    )

    class _Test extends React.Component<TestProps> {
      render() {
        return null
      }
    }

    const Test = injectIntl(_Test)

    // This test only need to pass the type checking.
    ;<Test base="base" type="a" text="text" />
  })
})
