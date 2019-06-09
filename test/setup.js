import { configure } from 'enzyme';
import * as React from 'react';
import 'intl-pluralrules';
import '@formatjs/intl-relativetimeformat/polyfill-locales';

let reactMajorVersion = Number.parseInt(React.version.slice(0, 2));
if (reactMajorVersion === 0) {
  reactMajorVersion = React.version.slice(2, 4);
}
const Adapter = require(`enzyme-adapter-react-${reactMajorVersion}`);

configure({ adapter: new Adapter() });
