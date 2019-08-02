import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Timezone from './TimeZone';
import Messages from './Messages';
import Advanced from './Advanced';

ReactDOM.render(<Timezone />, document.getElementById('timezone'));

ReactDOM.render(<Messages />, document.getElementById('messages'));

ReactDOM.render(<Advanced />, document.getElementById('advanced'));
