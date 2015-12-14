import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider, FormattedMessage} from 'react-intl';
import request from 'superagent';

const App = () => (
    <h1>
        <FormattedMessage id="hello" />{' '}
        <FormattedMessage id="world" />
    </h1>
);

class Root extends Component {
    constructor() {
        super();
        this.state = {
            translations: null,
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
    <Root />,
    document.getElementById('container')
);
