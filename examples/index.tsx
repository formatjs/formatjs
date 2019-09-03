import 'core-js/stable';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-relativetimeformat/polyfill';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Timezone from './TimeZone';
import Messages from './Messages';
import Advanced from './Advanced';
import Injected from './Injected';

ReactDOM.render(<Timezone />, document.getElementById('timezone'));

ReactDOM.render(<Messages />, document.getElementById('messages'));

ReactDOM.render(<Advanced />, document.getElementById('advanced'));
ReactDOM.render(<Injected />, document.getElementById('injected'));
