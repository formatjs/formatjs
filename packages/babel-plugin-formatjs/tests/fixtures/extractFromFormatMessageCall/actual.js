import {FormattedMessage, injectIntl} from 'react-intl';
import React, {Component} from 'react';

const objectPointer = {
  id: 'foo.bar.invalid',
  defaultMessage: 'This cannot be extracted',
  description: 'the plugin only supports inline objects',
};

class Foo extends Component {
  render() {
    const {intl} = this.props;
    const {
      intl: {formatMessage},
    } = this.props;
    const msgs = {
      baz: this.props.intl.formatMessage({
        id: 'foo.bar.baz',
        defaultMessage: 'Hello World!',
        description: 'The default message',
      }),
      biff: intl.formatMessage({
        id: 'foo.bar.biff',
        defaultMessage: 'Hello Nurse!',
        description: 'Another message',
      }),
      qux: formatMessage({
        id: 'foo.bar.qux',
        defaultMessage: 'Hello Stranger!',
        description: 'A different message',
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
