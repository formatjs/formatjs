const {configure} = require('enzyme');
require('@formatjs/intl-pluralrules/polyfill-locales');
require('@formatjs/intl-relativetimeformat/polyfill-locales');
require('@formatjs/intl-listformat/polyfill-locales');
require('@formatjs/intl-displaynames/polyfill-locales');
const Adapter = require('enzyme-adapter-react-16');

configure({adapter: new Adapter()});
