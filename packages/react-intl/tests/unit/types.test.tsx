import {defineMessages, useIntl} from '../../'
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
})
