import React, {Component} from 'react';
import { Link } from 'react-router';

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
export default App;
