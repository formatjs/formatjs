import React, {Component} from 'react'
import {FormattedMessage} from 'react-intl'

function nonStaticId() {
  return 'baz'
}

export default class Foo extends Component {
  render() {
    return <FormattedMessage id={`foo.bar.${nonStaticId()}`} />
  }
}
