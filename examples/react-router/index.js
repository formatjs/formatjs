import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, Link, hashHistory} from 'react-router';
import {
    IntlProvider,
    FormattedDate,
    FormattedNumber,
    FormattedPlural,
    FormattedMessage,
} from 'react-intl';

import messages from './i18n/base-en';
import * as i18n from './i18n';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
          locale: 'en'
        };

        this.changeLocale = this.changeLocale.bind(this);
    }

    changeLocale(e) {
        e.preventDefault();
        const newLocale = (this.state.locale === 'en') ? 'fr' : 'en';

        this.setState({
           locale: newLocale
        });
    }

    render() {
        const intlData = {
            locale: this.state.locale,
            messages: i18n[this.state.locale],
        };

        return (
          <IntlProvider key="intl" {...intlData}>
            <div>
                <h1>React Intl + React Router Example</h1>
                <ul>
                    <li><Link to="/"><FormattedMessage {...messages.home} /></Link></li>
                    <li><Link to="/inbox"><FormattedMessage {...messages.inbox} /></Link></li>
                    <li><a href="#" onClick={this.changeLocale}><FormattedMessage {...messages.otherLanguage} /></a></li>
                </ul>
                {this.props.children}
            </div>
          </IntlProvider>
        );
    }
}

const Home = () => (
    <div>
        <h2><FormattedMessage {...messages.home} /></h2>
        <p>
            <FormattedMessage {...messages.todayIs} /> {' '}
            <FormattedDate value={Date.now()} />
        </p>
    </div>
);

const Inbox = () => (
    <div>
        <h2><FormattedMessage {...messages.inbox} /></h2>
        <p>
            <FormattedMessage {...messages.youHave} /> {' '}
            <FormattedNumber value={1000} /> {' '}
            <FormattedPlural value={1000}
                one="message"
                other="messages"
            />.
        </p>
    </div>
);

ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={Home} />
            <Route path="inbox" component={Inbox} />
        </Route>
    </Router>,
    document.getElementById('container')
);
