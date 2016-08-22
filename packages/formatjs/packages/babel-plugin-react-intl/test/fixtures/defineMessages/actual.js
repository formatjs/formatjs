import {defineMessages} from 'react-intl';
import React from 'react';

export default class Foo extends React.Component {
    render() {
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
        return (
            <div>
                <h1>{this.props.intl.formatMessage(msgs.header)}</h1>
                <p>{this.props.intl.formatMessage(msgs.content)}</p>
            </div>
        );
    }
}
