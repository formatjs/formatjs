import React, {Component} from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';

defineMessages({
  test: {
    id: 'TRANSLATION_KEY',
  },
});

const testMessage = {id: 'TRANSLATION_KEY2'};

export default class Foo extends Component {
  render() {
    return (
      <>
        <FormattedMessage id="foo.bar.baz" />
        <FormattedMessage {...testMessage} />
      </>
    );
  }
}
