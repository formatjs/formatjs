import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';

export default class Foo extends Component {
  render() {
    // This is bad syntax (object property in message)
    return (
      <FormattedMessage
        id="foo.bar.baz"
        defaultMessage="Hello, {foo.baz}!"
        description="Broken message"
        values={{
          foo: {baz: 'biff'},
        }}
      />
    );
  }
}
