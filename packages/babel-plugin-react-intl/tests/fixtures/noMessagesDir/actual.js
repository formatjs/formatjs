import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';
export default class Foo extends Component {
  render() {
    return (
      <FormattedMessage
        description="Greeting to the world"
        defaultMessage="Hello World!"
      />
    );
  }
}
