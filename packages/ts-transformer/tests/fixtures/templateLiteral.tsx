import React, {Component} from 'react'
import {FormattedMessage, defineMessage} from 'react-intl'

defineMessage({
  id: `template`,
  defaultMessage: `should remove
    newline and
    extra spaces`,
})

defineMessage({
  id: `template dedent`,
  defaultMessage: dedent`dedent Hello World!`,
})

export default class Foo extends Component {
  render() {
    return (
      <>
        <FormattedMessage
          id="foo.bar.baz"
          defaultMessage={`Hello World!`}
          description="The default message."
        />
        <FormattedMessage
          id="dedent foo.bar.baz"
          defaultMessage={dedent`dedent 
            Hello World!`}
          description="The default message."
        />
      </>
    )
  }
}
