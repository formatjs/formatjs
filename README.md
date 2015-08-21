[React Intl][]
==============

This library provides [React][] Components and a Mixin for internationalizing React web apps. The components provide a declarative way to format dates, numbers, and string messages, including pluralization.

[![npm Version][npm-badge]][npm]
[![Build Status][travis-badge]][travis]
[![Dependency Status][david-badge]][david]

[![Sauce Test Status](https://saucelabs.com/browser-matrix/react-intl.svg)](https://saucelabs.com/u/react-intl)

Overview
--------

**React Intl is part of [FormatJS][], the docs can be found on the website:**

**<http://formatjs.io/react/>**

### Features

- Display numbers with separators.
- Display dates and times correctly.
- Display dates relative to "now".
- Pluralize labels in strings.
- Support for 150+ languages.
- Runs in the browser and Node.js.
- Built on standards.

### Example

There are many examples [on the website][React Intl], but here's a hello world one:

```js
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider, FormattedNumber, FormattedPlural} from 'react-intl';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name       : 'Eric',
            unreadCount: 1000,
        };
    }

    render() {
        return (
            <p>
                Hello <b>{this.state.name}</b>, you have {' '}
                <FormattedNumber value={this.state.unreadCount} />
                <FormattedPlural value={this.state.unreadCount}
                    one=" unread message."
                    other=" unread messages."
                />
            </p>
        );
    }
}

ReactDOM.render(
    <IntlProvider>
        <App />
    </IntlProvider>,
    document.getElementById('container')
);

```

This example would render: "Hello **Eric**, you have 1,000 unread messages." into the container element on the page.

**CDLR pluralization rules:** In some languages you have more then `one` and `other`. For example in `ru` there are the following plural rules: `one`, `few`, `many` and `other`.
Check out the official CDLR documentation from unicode.org http://www.unicode.org/cldr/charts/27/supplemental/language_plural_rules.html for all languages.

_Note:  You could also write ` =0 { No comments yet }`_

Contribute
---------

Let's make React Intl and FormatJS better! If you're interested in helping, all contributions are welcome and appreciated. React Intl is just one of many packages that make up the [FormatJS suite of packages][FormatJS GitHub], and you can contribute to any/all of them, including the [Format JS website][FormatJS] itself.

Check out the [Contributing document][CONTRIBUTING] for the details. Thanks!


License
-------

This software is free to use under the Yahoo Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.


[React Intl]: http://formatjs.io/react/
[npm]: https://www.npmjs.org/package/react-intl
[npm-badge]: https://img.shields.io/npm/v/react-intl.svg?style=flat-square
[david]: https://david-dm.org/yahoo/react-intl
[david-badge]: https://img.shields.io/david/yahoo/react-intl.svg?style=flat-square
[travis]: https://travis-ci.org/yahoo/react-intl
[travis-badge]: https://img.shields.io/travis/yahoo/react-intl/master.svg?style=flat-square
[React]: http://facebook.github.io/react/
[FormatJS]: http://formatjs.io/
[FormatJS GitHub]: http://formatjs.io/github/
[ICU Message syntax]: http://formatjs.io/guide/#messageformat-syntax
[CONTRIBUTING]: https://github.com/yahoo/react-intl/blob/master/CONTRIBUTING.md
[LICENSE file]: https://github.com/yahoo/react-intl/blob/master/LICENSE.md
