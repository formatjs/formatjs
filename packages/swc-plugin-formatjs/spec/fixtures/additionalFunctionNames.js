// @react-intl project:foo
import React, {Component} from 'react'

function CustomMessage() {}

export default class Foo extends Component {
  render() {
    t({
      defaultMessage: 't',
    })
    return (
      <CustomMessage
        id={formatMessage({
          defaultMessage: 'foo',
        })}
        description={$formatMessage({
          defaultMessage: 'foo2',
        })}
        defaultMessage="Hello World!"
      />
    )
  }
}
