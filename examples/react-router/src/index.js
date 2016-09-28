import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import {Router, Route, IndexRoute, hashHistory} from 'react-router';

import App from './components/App';
import Home from './components/Home';
import Inbox from './components/Inbox';

ReactDOM.render(
    <IntlProvider locale="en">
        <Router history={hashHistory}>
            <Route path="/" component={App}>
                <IndexRoute component={Home} />
                <Route path="inbox" component={Inbox} />
            </Route>
        </Router>
    </IntlProvider>,
    document.getElementById('root')
);
