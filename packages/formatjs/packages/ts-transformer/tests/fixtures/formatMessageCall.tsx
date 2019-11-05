import React, {Component} from 'react';
import {injectIntl, FormattedMessage} from 'react-intl';

const objectPointer = {
  id: 'foo.bar.invalid',
  defaultMessage: 'This cannot be extracted',
  description: 'the plugin only supports inline objects',
};

class Foo extends Component {
  render() {
    const msgs = {
      baz: this.props.intl.formatMessage({
        id: 'foo.bar.baz',
        defaultMessage: 'Hello World!',
        description: 'The default message',
      }),
      biff: this.props.intl.formatMessage({
        id: 'foo.bar.biff',
        defaultMessage: 'Hello Nurse!',
        description: 'Another message',
      }),
      invalid: this.props.intl.formatMessage(objectPointer),
    };

    return (
      <div>
        <h1>{msgs.header}</h1>
        <p>{msgs.content}</p>
        <span>
          <FormattedMessage id="foo" defaultMessage="bar" description="baz" />
        </span>
      </div>
    );
  }
}

export default injectIntl(Foo);
