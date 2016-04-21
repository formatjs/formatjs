import React, {Component, PropTypes} from 'react';
import {IntlProvider, FormattedMessage} from 'react-intl';
import Greeting from './widgets/greeting';
import Container from './widgets/container';

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

                <IntlProvider
                    messages={this.props.getIntlMessages('greeting')}
                >
                    <Greeting {...this.state.user} />
                </IntlProvider>

                <Container
                    getIntlMessages={this.props.getIntlMessages}
                    app={<FormattedMessage id="app" defaultMessage={'App'} />}
                />
            </div>
        );
    }
}

App.propTypes = {
    getIntlMessages: PropTypes.func.isRequired,
};

export default App;
