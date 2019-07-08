import {configure} from 'enzyme';
import * as React from 'react';
import 'intl-pluralrules';
import '@formatjs/intl-relativetimeformat/polyfill-locales';
import {parse} from 'intl-messageformat-parser';
import IntlMessageFormat from 'intl-messageformat/lib/core';
IntlMessageFormat.__parse = parse;

let reactMajorVersion = Number.parseInt(React.version.slice(0, 2));
if (reactMajorVersion === 0) {
  reactMajorVersion = React.version.slice(2, 4);
}
const Adapter = require(`enzyme-adapter-react-${reactMajorVersion}`);

configure({adapter: new Adapter()});

function toBeA(received, typeNameOrObj) {
  let pass;
  if (typeof typeNameOrObj === 'string') {
    pass = typeof received === typeNameOrObj;
  } else {
    pass = received instanceof typeNameOrObj;
  }
  if (pass) {
    return {
      message: () => `expected ${received} to have type ${typeNameOrObj}`,
      pass: true,
    };
  }
  return {
    message: () => `expected ${received} not to have type ${typeNameOrObj}`,
    pass: false,
  };
}

expect.extend({
  toBeA,
  toBeAn: toBeA,
});
