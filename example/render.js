// this script is meant to run in nodejs to output the rendered content on the server side

// IMPORTANT: make sure you install the jsx CLI: `npm install -g react-tools`, and
//            run `jsx src/ build/` within the `example/` folder to render the content on the server side.

global.Intl = require('intl');

// making React a global variable on the server side
global.React = require('react');
// requiring the Intl mixin
global.ReactIntlMixin = require('../'); // require('react-intl');

// requiring components
require('./build/components.js');

var i18n = {
  locales: ["en-US"],
  messages: {
    SHORT: "{product} cost {price, number, usd} if ordered by {deadline, date, medium}",
    LONG: "{product} cost {price, number, usd} (or {price, number, eur}) if ordered by {deadline, date, medium}"
  }
};

var Container = React.createFactory(global.ContainerComponent);

console.log(React.renderToString(
  Container({
    locales: i18n.locales,
    messages: i18n.messages
  })
));
