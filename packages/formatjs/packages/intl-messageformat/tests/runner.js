if (typeof Intl === "undefined") {
  require("intl");
}

require('intl-pluralrules')

global.expect = require("expect.js");
global.IntlMessageFormat = require("../");

require("./index");
