import { configure } from 'enzyme';
import React from 'react';

let reactMajorVersion = Number.parseInt(React.version.slice(0, 2));
if (reactMajorVersion === 0) {
  reactMajorVersion = React.version.slice(2, 4);
}
const Adapter = require(`enzyme-adapter-react-${reactMajorVersion}`);

configure({ adapter: new Adapter() });
