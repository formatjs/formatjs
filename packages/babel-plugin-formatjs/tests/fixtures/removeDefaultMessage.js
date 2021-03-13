import React, {Component} from 'react'
import {defineMessages, FormattedMessage} from 'react-intl'

defineMessages({
  foo: {
    id: 'greeting-user',
    description: 'Greeting the user',
    defaultMessage: 'Hello, {name}',
  },
  foo2: {
    description: 'foo2',
    defaultMessage: 'foo2-msg',
  },
  foo3: {
    defaultMessage: 'foo3-msg',
  },
})

export default class Foo extends Component {
  render() {
    return (
      <>
        <FormattedMessage
          id="greeting-world"
          description="Greeting to the world"
          defaultMessage="Hello World!"
        />
        <FormattedMessage
          defaultMessage="message with desc"
          description="desc with desc"
        />
        <FormattedMessage defaultMessage="message only" />
      </>
    )
  }
}
