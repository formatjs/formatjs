import React, {Component} from 'react'
import {FormattedMessage} from 'react-intl'

export default class Foo extends Component {
  render() {
    const msg = msgs?.header
    return <FormattedMessage id="message" defaultMessage="Actual" />
  }
}
