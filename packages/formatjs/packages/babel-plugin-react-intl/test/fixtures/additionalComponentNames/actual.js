import React, {Component} from 'react';

function CustomMessage() {}

export default class Foo extends Component {
  render() {
    return (
      <CustomMessage
        id="greeting-world"
        description="Greeting to the world"
        defaultMessage="Hello World!"
      />
    );
  }
}
