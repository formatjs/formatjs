import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, Link, hashHistory} from 'react-router';
import {
    IntlProvider,
    FormattedDate,
    FormattedNumber,
    FormattedPlural,
} from 'react-intl';

class App extends Component {
    render() {
        return (
            <div>
                <h1>React Intl + React Router Example</h1>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/inbox">Inbox</Link></li>
                </ul>
                {this.props.children}
            </div>
        );
    }
}

const Home = () => (
    <div>
        <h2>Home</h2>
        <p>
            Today is {' '}
            <FormattedDate value={Date.now()} />
        </p>
    </div>
);

const Inbox = () => (
    <div>
        <h2>Inbox</h2>
        <p>
            You have {' '}
            <FormattedNumber value={1000} /> {' '}
            <FormattedPlural value={1000}
                one="message"
                other="messages"
            />.
        </p>
    </div>
);

ReactDOM.render(
    <IntlProvider locale="en">
        <Router history={hashHistory}>
            <Route path="/" component={App}>
                <IndexRoute component={Home} />
                <Route path="inbox" component={Inbox} />
            </Route>
        </Router>
    </IntlProvider>,
    document.getElementById('container')
);
