import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';

const messages = defineMessages({
  foo: {
    id: 'greeting-user',
    description: 'Greeting the user',
    defaultMessage: 'Hello, {name}',
  },
});

export default class Foo extends Component {
  render() {
    return (
      <FormattedMessage
        id="greeting-world"
        description="Greeting to the world"
        defaultMessage="Hello World!"
      />
    );
  }
}
