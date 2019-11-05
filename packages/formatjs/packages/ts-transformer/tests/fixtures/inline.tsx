import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';
import {_} from '@formatjs/macro';

export default class Foo extends Component {
  render() {
    return (
      <div>
        <FormattedMessage
          id="foo.bar.baz"
          defaultMessage="Hello World!"
          description="The default message."
        />
        {_({
          id: 'header',
          defaultMessage: 'Hello World!',
          description: 'The default message',
        })}
        {_({
          id: 'header2',
          defaultMessage: 'Hello World!',
          description: 'The default message',
        })}
      </div>
    );
  }
}
