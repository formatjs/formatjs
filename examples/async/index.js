import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider, injectIntl} from 'react-intl';
import request from 'superagent';

class App extends Component {
    render() {
        const {formatMessage} = this.props.intl;
        return (
            <h1>
                {formatMessage({ id: 'hello' }) + ' ' + formatMessage({ id: 'world' })}
            </h1>
        );
    }
}

App = injectIntl(App);

class Root extends Component {
    constructor() {
        super();
        this.state = {
            translations: null
        };
    }
    componentWillMount() {
        request.get('/translations', (err, res) => {
            this.setState({
                translations: res.body,
            });
        });
    }

    render() {
        let children;

        if (this.state.translations) {
            children = (
                <IntlProvider locale="en" messages={this.state.translations}>
                    <App/>
                </IntlProvider>
            );
        }

        return <div>{children}</div>;
    }
}

ReactDOM.render(
    <Root/>,
    document.getElementById('container')
);
