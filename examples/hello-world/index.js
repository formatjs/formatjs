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
        return (
            <p>
                Hello <b>{this.state.name}</b>, you have {' '}
                <FormattedNumber value={this.state.unreadCount} />
                <FormattedPlural value={this.state.unreadCount}
                    one=" unread message."
                    other=" unread messages."
                />
            </p>
        );
    }
}

ReactDOM.render(
    <IntlProvider>
        <App />
    </IntlProvider>,
    document.getElementById('container')
);
