import React, {Component, PropTypes} from 'react';
import {FormattedMessage} from 'react-intl';
import Greeting from './widgets/greeting';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: {
                name         : 'Eric',
                unreadCount  : 4,
                lastLoginTime: Date.now() - 1000 * 5,
            },
        };
    }

    render() {
        return (
            <div>
                <h1>
                    <FormattedMessage
                        id="app.title"
                        defaultMessage="React Intl Nested Messages Example"
                    />
                </h1>
                <Greeting
                    messages={this.props.getIntlMessages('greeting')}
                    messages={this.context.intl.locale}
                    {...this.state.user}
                />
            </div>
        );
    }
}

App.propTypes = {
    getIntlMessages: PropTypes.func.isRequired,
};

export default App;
