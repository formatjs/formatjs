import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';

export default class Foo extends Component {
  render() {
    return <FormattedMessage id="foo.bar.baz" defaultMessage="Hello World!" />;
  }
}
