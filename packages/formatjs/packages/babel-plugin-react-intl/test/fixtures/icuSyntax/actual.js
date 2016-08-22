import {FormattedMessage} from 'react-intl';
import React from 'react';

export default class Foo extends React.Component {
    render() {
        // This is bad syntax (object property in message)
        return (
          <FormattedMessage
              id="foo.bar.baz"
              defaultMessage="Hello, {foo.baz}!"
              description="Broken message"
              values={{
                  foo: {baz: 'biff'},
              }} />
        );
    }
}
