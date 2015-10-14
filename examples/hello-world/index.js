import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider, FormattedNumber, FormattedPlural} from 'react-intl';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name       : 'Eric',
            unreadCount: 1000,
        };
    }

    render() {
        const {name, unreadCount} = this.state;

        return (
            <p>
                Hello <b>{name}</b>, you have {' '}
                <FormattedNumber value={unreadCount} /> {' '}
                <FormattedPlural value={unreadCount}
                    one="message"
                    other="messages"
                />.
            </p>
        );
    }
}

ReactDOM.render(
    <IntlProvider locale="en">
        <App />
    </IntlProvider>,
    document.getElementById('container')
);
