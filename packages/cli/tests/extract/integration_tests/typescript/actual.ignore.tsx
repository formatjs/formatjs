import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';

const msgs = defineMessages({
  test: {
    id: 'ignore',
    defaultMessage: 'ignore',
  },
});

export default class Foo extends Component {
  render() {
    return (
      <div>
        <h1>
          <FormattedMessage {...msgs.test} />
        </h1>
      </div>
    );
  }
}
