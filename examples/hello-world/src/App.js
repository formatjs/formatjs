import React, { Component } from 'react';
import { FormattedMessage, FormattedRelative } from 'react-intl';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: 'Eric',
            unreadCount: 1000,
        };
    }

    render() {
        const {name, unreadCount} = this.state;

        return (
            <div>
                <p>
                    <FormattedMessage
                        id="welcome"
                        defaultMessage={`Hello {name}, you have {unreadCount, number} {unreadCount, plural,
                      one {message}
                      other {messages}
                    }`}
                        values={{ name: <b>{name}</b>, unreadCount }}
                        />
                </p>
                <p> Last update <FormattedRelative value={Date.now() - 3600000} /> </p>
            </div>
        );
    }
}


export default App;
