import 'core-js/stable';
import '@formatjs/intl-pluralrules/polyfill';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Timezone from './TimeZone';
import Messages from './Messages';
import Hooks from './Hooks';
import Advanced from './Advanced';
import Injected from './Injected';
import HandleChange from './HandleChange';
import StaticTypeSafetyAndCodeSplitting from './StaticTypeSafetyAndCodeSplitting/StaticTypeSafetyAndCodeSplitting';

ReactDOM.render(<Timezone />, document.getElementById('timezone'));

ReactDOM.render(<Messages />, document.getElementById('messages'));
ReactDOM.render(<Hooks />, document.getElementById('hooks'));

ReactDOM.render(<Advanced />, document.getElementById('advanced'));
ReactDOM.render(<Injected />, document.getElementById('injected'));
ReactDOM.render(<HandleChange />, document.getElementById('handlechange'));

ReactDOM.render(
  <StaticTypeSafetyAndCodeSplitting />,
  document.getElementById('static-type-safety-and-code-splitting')
);
