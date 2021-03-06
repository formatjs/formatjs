import React, {Component} from 'react';
import {FormattedMessage, defineMessage} from 'react-intl';

defineMessage({
  id: `template`,
  defaultMessage: `should remove
    newline and
    extra spaces`,
});

export default class Foo extends Component {
  render() {
    return (
      <FormattedMessage
        id="foo.bar.baz"
        defaultMessage={`Hello World!`}
        description="The default message."
      />
    );
  }
}
