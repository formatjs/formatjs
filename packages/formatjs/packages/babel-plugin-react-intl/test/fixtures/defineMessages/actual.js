import React, {Component} from 'react';
import {defineMessages, FormattedMessage} from 'react-intl';

const msgs = defineMessages({
    header: {
        id: 'foo.bar.baz',
        defaultMessage: 'Hello World!',
        description: 'The default message',
    },
    content: {
        id: 'foo.bar.biff',
        defaultMessage: 'Hello Nurse!',
        description: 'Another message',
    },
});

export default class Foo extends Component {
    render() {
        return (
            <div>
                <h1><FormattedMessage {...msgs.header}/></h1>
                <p><FormattedMessage {...msgs.content}/></p>
            </div>
        );
    }
}
