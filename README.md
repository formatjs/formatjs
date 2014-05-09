React Intl Mixin
================

This repository contains a ReactJS Component Mixin to implement Internationalization
features in a react component. The Intl Mixin provides a series of methods that
can be used in the `render` method of the component to provide date formatting,
number formatting, as well as plural and gender based translations.

## Installation

### Browser

1. Install with [bower](http://bower.io/): `bower install react-intl`
2. Load the scripts into your page.

    ```html
    <script src="path/to/react.js"></script>
    <script src="path/to/intl-messageformat.js"></script>
    <script src="path/to/react-intl.js"></script>
    ```

_note: for older browsers, and safari, you might need to also load [Intl.js][] polyfill before
including `intl-messageformat` library.

3. Creating a React component with the Intl mixin:

    ```javascript
    var MyComponent = React.createClass({
      mixins: [ReactIntlMixin],
      getMyMessage: function () {
        return "{product} cost {price, number} if ordered by {deadline, date}"
      },
      render: function () {
        return <div>
          <p>{this.intlDate(new Date())}</p>
          <p>{this.intlNumber(600)}</p>
          <p>{this.intlMessage(this.getMyMessage(), {
            product: 'apples',
            price: 2000.0015,
            deadline: new Date()
          })}
        </div>;
      }
    });
    ```

4. Using the React component by specifying the `locales`:


    ```javascript
    React.renderComponent(
      <MyComponent locales={["fr-FR"]}/>,
      document.getElementById('example')
    );
    ```

### Node/CommonJS

1. You can install the mixin with npm: `npm install react-intl`
2. Load in the module and register it:

    ```javascript
    var ReactIntlMixin = require('react-intl');
    ```

Limitations
-----------

Not all browsers have implemented ECMAScript 402, which is the internationalization API, for older browsers, and Safari, you might need to patch the browser by loading [Intl.js][] polyfill before
including `intl-messageformat` library.

[Intl.js]: https://github.com/andyearnshaw/Intl.js
