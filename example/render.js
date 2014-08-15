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

console.log(React.renderComponentToString(
  global.Container({ locales: ["en-US"] })
));
