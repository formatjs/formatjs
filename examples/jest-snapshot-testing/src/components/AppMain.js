import React, { Component } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

const messages = defineMessages({
    text: {
        id: 'app-main__counter',
        defaultMessage: 'Counter {value}',
    },
});

class AppMain extends Component {

    state = { counter: 1 }

    increment() {
        this.setState({
            counter: this.state.counter + 1,
        });
    }

    onClick = () => {
        this.increment();
    }

    render() {
        const { counter } = this.state;

        return (
            <main className="app-main" onClick={this.onClick}>
                <div className="app-main__counter">
                    <FormattedMessage {...messages.text} values={{value: counter}}/>
                </div>
            </main>
        );
    }
}

export default AppMain;
