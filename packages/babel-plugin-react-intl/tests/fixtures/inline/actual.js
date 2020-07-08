import React, {Component} from 'react';
import {FormattedMessage, defineMessage} from 'react-intl';

export default class Foo extends Component {
  render() {
    return (
      <div>
        <FormattedMessage
          id="foo.bar.baz"
          defaultMessage="Hello World!"
          description="The default message."
        />
        {defineMessage({
          id: 'header',
          defaultMessage: 'Hello World!',
          description: 'The default message',
        })}
        {defineMessage({
          id: 'header2',
          defaultMessage: 'Hello World!',
          description: 'The default message',
        })}
      </div>
    );
  }
}
