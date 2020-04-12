import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';

// @react-intl project:amazing2
export default class Foo extends Component {
  render() {
    return (
      <FormattedMessage
        id="foo.bar.baz"
        defaultMessage="Hello World!"
        description={{
          text: 'Something for the translator.',
          metadata: 'Additional metadata content.',
        }}
      />
    );
  }
}
