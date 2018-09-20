import React, {Component} from 'react';
import { Route, Link } from 'react-router-dom';

import Home from './Home';
import Inbox from './Inbox';

class App extends Component {
    render() {
        return (
            <div>
                <h1>React Intl + React Router Example</h1>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/inbox">Inbox</Link></li>
                </ul>
                <Route exact path="/" component={Home} />
                <Route path="/inbox" component={Inbox} />
            </div>
        );
    }
}
export default App;
