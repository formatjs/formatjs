import React, {Component} from 'react';
import {IntlProvider} from 'react-intl';
import HelloMessage from './hello-message';

export default class App extends Component {
    render() {
        return (
            <IntlProvider>
                <HelloMessage name={<b>Eric</b>} unreadCount={1000} />
            </IntlProvider>
        );
    }
}
