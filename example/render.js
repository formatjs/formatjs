// this script is meant to run in nodejs to output the rendered content on the server side

// making React a global variable on the server side
global.React = require('react');
// requiring the Intl mixin
require('../'); // require('react-intl');

// requiring components
require('./build/components.js');

console.log(React.renderComponentToString(
  global.Container({ locales: ["en-US"] })
));
