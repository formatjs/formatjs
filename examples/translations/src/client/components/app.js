import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';
import LocalesMenu from './locales-menu';
import Greeting from './greeting';

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: {
                name         : 'Eric',
                unreadCount  : 4,
                lastLoginTime: Date.now() - 1000 * 60 * 60 * 24,
            },
        };
    }

    render() {
        return (
            <div>
                <h1>
                    <FormattedMessage
                        id="app.title"
                        defaultMessage="React Intl Translations Example"
                    />
                </h1>

                <Greeting user={this.state.user} />

                <h4>
                    <FormattedMessage
                        id="app.locales_menu_heading"
                        defaultMessage="Locales:"
                    />
                </h4>
                <LocalesMenu />
            </div>
        );
    }
}
