# Testing with React-Intl

<!-- toc -->

- [`Intl` APIs requirements](#intl-apis-requirements)
  - [Mocha](#mocha)
    - [Command Line](#command-line)
    - [Browser](#browser)
  - [Karma](#karma)
- [Shallow Rendering](#shallow-rendering)
  - [Testing Example Components That Use React Intl](#testing-example-components-that-use-react-intl)
    - [(Basic)](#-basic)
    - [(Advanced, Uses `injectIntl()`)](#-advanced-uses-injectintl)
- [DOM Rendering](#dom-rendering)
  - [Helper function](#helper-function)
- [Enzyme](#enzyme)
  - [Helper function](#helper-function-1)
  - [Usage](#usage)
- [Jest](#jest)
  - [Snapshot Testing](#snapshot-testing)
    - [Helper function](#helper-function-2)
    - [Usage](#usage-1)
    - [Usage with Jest & enzyme](#usage-with-jest--enzyme)
  - [DOM Testing](#dom-testing)
- [Storybook](#storybook)
  - [Intl](#intl)
- [react-testing-library](#react-testing-library)

<!-- tocstop -->

## `Intl` APIs requirements

React Intl uses the built-in [`Intl` APIs](https://mdn.io/intl) in JavaScript. Make sure your environment satisfy the requirements listed in [`Intl` APIs requirements](Getting-Started.md##intl-apis-requirements)

### Mocha

If you're using [Mocha](https://mochajs.org/) as your test runner and testing on older JavaScript runtimes, you can load the Intl Polyfill via the CLI or by adding a `<script>` in the browser.

#### Command Line

Run `mocha` and auto-polyfill the runtime if needed:

```
$ mocha --recursive test/
```

#### Browser

You can either load the polyfill in the browser from `node_modules` or use the [polyfill.io](https://cdn.polyfill.io/v2/docs/) service from the Financial Times:

```html
<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=Intl,Intl.~locale.en-US"></script>
```

### Karma

If you're using [Karma](https://karma-runner.github.io/) as your test runner and need to test in an older browser or [PhantomJS](http://phantomjs.org/) you can use [**karma-intl-shim**](https://github.com/walmartlabs/karma-intl-shim) created by Walmart Labs.

## Shallow Rendering

React's `react-addons-test-utils` package contains a [shallow rendering](http://facebook.github.io/react/docs/test-utils.html#shallow-rendering) feature which you might use to test your app's React components. If a component you're trying to test using `ReactShallowRenderer` uses React Intl — specifically `injectIntl()` — you'll need to do extra setup work because React Intl components expect to be nested inside an `<IntlProvider>`.

### Testing Example Components That Use React Intl

The following examples will assume `mocha`, `expect`, and `expect-jsx` test framework.

#### <ShortDate> (Basic)

```js
import React from 'react';
import {FormattedDate} from 'react-intl';

const ShortDate = props => (
  <FormattedDate
    value={props.date}
    year="numeric"
    month="short"
    day="2-digit"
  />
);

export default ShortDate;
```

Testing the `<ShortDate>` example component is no different than testing any other basic component in your app using React's shallow rendering:

```js
import expect from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from 'react-addons-test-utils';
import {FormattedDate} from 'react-intl';
import ShortDate from '../short-date';

expect.extend(expectJSX);

describe('<ShortDate>', function() {
  it('renders', function() {
    const renderer = createRenderer();
    const date = new Date();

    renderer.render(<ShortDate date={date} />);
    expect(renderer.getRenderOutput()).toEqualJSX(
      <FormattedDate value={date} year="numeric" month="short" day="2-digit" />
    );
  });
});
```

#### <RelativeDate> (Advanced, Uses `injectIntl()`)

```js
import React, {Component} from 'react';
import {injectIntl, FormattedRelative} from 'react-intl';

const RelativeDate = props => (
  <span title={props.intl.formatDate(props.value)}>
    <FormattedRelative value={props.value} />
  </span>
);

// Using `injectIntl()` to make React Intl's imperative API available to format
// the date to a string value for the `title` attribute.
export default injectIntl(RelativeDate);
```

Testing the `<RelativeDate>` example component is more complicated because it uses `injectIntl()` which creates a wrapper component around the component you defined in your app.

Shallow rendering only tests one level deep and we want to test the rendering of the component defined for our app, so we need to access it via the wrapper's `WrappedComponent` property. Its value will be the component we passed into `injectIntl()`.

Under the hood, `injectIntl()` passes `context.intl` which was created from the `<IntlProvider>` in the component's ancestry to `props.intl`. What we need to do is simulate this for our shallow rendering test:

```js
import expect from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from 'react-addons-test-utils';
import {IntlProvider, FormattedRelative, createIntl} from 'react-intl';
import RelativeDate from '../relative-date';

expect.extend(expectJSX);

describe('<RelativeDate>', function() {
  it('renders', function() {
    const renderer = createRenderer();
    const date = new Date();

    const intl = createIntl({
      locale: 'en',
      defaultLocale: 'en',
    });

    // Access the underlying `<RelativeDate>` component from the wrapper
    // component returned from calling `injectIntl()`, and create an
    // element making sure to pass the `intl` API as a prop to the to
    // simulate what `injectIntl()` does.
    renderer.render(<RelativeDate.WrappedComponent date={date} intl={intl} />);

    // Use the `intl` API directly to format the date for the expected
    // output. This is important when testing absolute dates since their
    // values will differ based on the timezone where the test is running.
    expect(renderer.getRenderOutput()).toEqualJSX(
      <span title={intl.formatDate(date)}>
        <FormattedRelative value={date} />
      </span>
    );
  });
});
```

## DOM Rendering

If you use the DOM in your tests, you need to supply the `IntlProvider` context to your components using composition:

```js
let element = ReactTestUtils.renderIntoDocument(
  <IntlProvider>
    <MyComponent />
  </IntlProvider>
);
```

However this means that the `element` reference is now pointing to the `IntlProvider` instead of your component. To retrieve a reference to your wrapped component, you can use "refs" with these changes to the code:

In your component, remember to add `{withRef: true}` when calling `injectIntl()`:

```js
class MyComponent extends React.Component {
  ...
  myClassFn() { ... }
}
export default injectIntl(MyComponent, {withRef: true});
```

In your test, add a "ref" to extract the reference to your tested component:

```js
let element;
let root = ReactTestUtils.renderIntoDocument(
  <IntlProvider>
    <MyComponent ref={c => (element = c.refs.wrappedInstance)} />
  </IntlProvider>
);
```

You can now access the wrapped component instance from `element` like this:

```js
element.myClassFn();
```

### Helper function

Since you will have to do this in all your unit tests, you should probably wrap that setup in a `render` function like this:

```js
function renderWithIntl(element) {
  let instance;

  ReactTestUtils.renderIntoDocument(
    <IntlProvider>
      {React.cloneElement(element, {
        ref: c => (instance = c.refs.wrappedInstance),
      })}
    </IntlProvider>
  );

  return instance;
}
```

You can now use this in your tests like this:

```js
let element = renderWithIntl(<MyElement>);
element.myClassFn();
```

## Enzyme

Testing with Enzyme works in a similar fashion as written above. Your `mount()`ed and `shallow()`ed components will need access to the `intl` context. Below is a helper function which you can import and use to mount your components which make use of any of React-Intl's library (either `<Formatted* />` components or `format*()` methods through `injectIntl`).

### Helper function

```tsx
/**
 * Components using the react-intl module require access to the intl context.
 * This is not available when mounting single components in Enzyme.
 * These helper functions aim to address that and wrap a valid,
 * English-locale intl context around them.
 */

import React from 'react';
import {IntlProvider} from 'react-intl';
import {mount, shallow} from 'enzyme';

// You can pass your messages to the IntlProvider. Optional: remove if unneeded.
const messages = require('../locales/en'); // en.json
const defaultLocale = 'en';
const locale = defaultLocale;

export function mountWithIntl(node: React.ReactElement) {
  return mount(node, {
    wrappingComponent: IntlProvider,
    wrappingComponentProps: {
      locale,
      defaultLocale,
      messages,
    },
  });
}

export function shallowWithIntl(node: React.ReactElement) {
  return shallow(node, {
    wrappingComponent: IntlProvider,
    wrappingComponentProps: {
      locale,
      defaultLocale,
      messages,
    },
  });
}
```

### Usage

Create a file with the above helper in e.g. `helpers/intl-enzyme-test-helper.js` and `import` the methods you need in your tests.

```js
// intl-enzyme-test-helper.js

import {mountWithIntl} from 'helpers/intl-enzyme-test-helper.js';

const wrapper = mountWithIntl(<CustomComponent />);

expect(wrapper.state('foo')).to.equal('bar'); // OK
expect(wrapper.text()).to.equal('Hello World!'); // OK
```

Based on [this gist](https://gist.github.com/mirague/c05f4da0d781a9b339b501f1d5d33c37/).

## Jest

Testing with Jest can be divided into two approaches: snapshot's testing and DOM testing. Snapshot's testing is a relatively new feature and works out of the box. If you'd like DOM testing you need to use Enzyme or React's TestUtils.

### Snapshot Testing

Snapshot testing is a new feature of Jest that automatically generates text snapshots of your components and saves them on the disk so if the UI output changes, you get notified without manually writing any assertions on the component output. Use either helper function or mock as described below.

#### Helper function

```js
import React from 'react';
import renderer from 'react-test-renderer';
import {IntlProvider} from 'react-intl';

const createComponentWithIntl = (children, props = {locale: 'en'}) => {
  return renderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

export default createComponentWithIntl;
```

#### Usage

```js
import React from 'react';
import createComponentWithIntl from '../../utils/createComponentWithIntl';
import AppMain from '../AppMain';

test('app main should be rendered', () => {
  const component = createComponentWithIntl(<AppMain />);

  let tree = component.toJSON();

  expect(tree).toMatchSnapshot();

  tree.props.onClick();

  tree = component.toJSON();

  expect(tree).toMatchSnapshot();
});
```

You can find runnable example [here](https://github.com/formatjs/react-intl/tree/master/examples/jest-snapshot-testing) and more info about Jest [here](http://facebook.github.io/jest/).

#### Usage with Jest & enzyme

Jest will automatically mock react-intl, so no any extra implementation is needed, tests should work as is:

```js
import React from 'react';
import {shallow} from 'enzyme';
import AppMain from '../AppMain';

test('app main should be rendered', () => {
  const wrapper = shallow(<AppMain />);
  expect(wrapper).toMatchSnapshot();
});
```

### DOM Testing

If you want use Jest with DOM Testing read more info above in Enzyme section or in offical Jest [documentation](http://facebook.github.io/jest/docs/tutorial-react.html#dom-testing).

## Storybook

### Intl

If you want to use `react-intl` inside of [Storybook](https://storybooks.js.org) you can use [`storybook-addon-intl`](https://github.com/truffls/storybook-addon-intl) which provides an easy to use wrapper for `react-intl` including a locale switcher so you can test your component in all provided languages.

## react-testing-library

To use `react-intl` and [`react-testing-library`](https://testing-library.com/docs/react-testing-library/intro) together it is not much different than other test libraries, you should provide some helper function to the testing flow.

You can check the [docs](https://testing-library.com/docs/example-react-intl).

And can find a functional example [here](https://github.com/testing-library/react-testing-library/blob/master/examples/__tests__/react-intl.js)

```jsx
import React from 'react';
import 'jest-dom/extend-expect';
import {render, cleanup, getByTestId} from 'react-testing-library';
import {IntlProvider, FormattedDate} from 'react-intl';
import IntlPolyfill from 'intl';
import 'intl/locale-data/jsonp/pt';

const FormatDateView = () => {
  return (
    <div data-testid="date-display">
      <FormattedDate
        value="2019-03-11"
        timeZone="utc"
        day="2-digit"
        month="2-digit"
        year="numeric"
      />
    </div>
  );
};

const renderWithReactIntl = component => {
  return render(<IntlProvider locale="pt">{component}</IntlProvider>);
};

afterEach(cleanup);

test('it should render FormattedDate and have a formated pt date', () => {
  const {container} = renderWithReactIntl(<FormatDateView />);
  expect(getByTestId(container, 'date-display')).toHaveTextContent(
    '11/03/2019'
  );
});
```
