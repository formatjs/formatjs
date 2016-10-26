import React, {Component} from 'react';
import {FormattedDate, FormattedTime} from 'react-intl';

class App extends Component {
    render() {
        const currentTime = new Date();

        return <p>
            The date in Tokyo is: <FormattedDate value={currentTime} />
            <br />
            The time in Tokyo is: <FormattedTime value={currentTime} />
        </p>;
    }
}


export default App;
