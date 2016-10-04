import React, {Component} from 'react';
import { Match, Link } from 'react-router';

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
                <Match exactly pattern="/" component={Home} />
                <Match pattern="/inbox" component={Inbox} />
            </div>
        );
    }
}
export default App;
