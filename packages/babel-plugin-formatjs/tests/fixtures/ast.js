import React, {Component} from 'react'
import {FormattedMessage, defineMessage, defineMessages} from 'react-intl'

defineMessage({
  id: 'defineMessage',
  defaultMessage: 'this is a {dt, date, full}',
})

defineMessages({
  foo: {
    id: 'defineMessages1',
    defaultMessage: 'this is a {dt, time, full}',
  },
  bar: {
    id: 'defineMessages2',
    defaultMessage: 'this is a {dt, number}',
  },
  baz: {
    id: 'compiled',
    defaultMessage: [{type: 0, value: 'asd'}],
  },
})

export default class Foo extends Component {
  render() {
    Intl.formatMessage({
      id: 'intl.formatMessage',
      defaultMessage: 'foo {s, plural, one{1} other{2}}',
    })
    return (
      <>
        <FormattedMessage
          id="foo.bar.baz"
          defaultMessage="Hello World!"
          description="The default message."
        />
        <FormattedMessage
          id="compiled2"
          defaultMessage={[{type: 0, value: 'compiled comp'}]}
          description="The default message."
        />
      </>
    )
  }
}
