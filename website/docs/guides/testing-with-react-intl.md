---
id: testing
title: Testing with formatjs
---

## `Intl` APIs requirements

React Intl uses the built-in [`Intl` APIs](https://mdn.io/intl) in JavaScript. Make sure your environment satisfy the requirements listed in [`Intl` APIs requirements](../guides/runtime-requirements.md)

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

## Shallow Rendering

React's `react-addons-test-utils` package contains a [shallow rendering](http://facebook.github.io/react/docs/test-utils.html#shallow-rendering) feature which you might use to test your app's React components. If a component you're trying to test using `ReactShallowRenderer` uses React Intl — specifically `injectIntl()` — you'll need to do extra setup work because React Intl components expect to be nested inside an `<IntlProvider>`.

### Testing Example Components That Use React Intl

The following examples will assume `mocha`, `expect`, and `expect-jsx` test framework.

#### ShortDate (Basic)

```tsx
import React from 'react'
import {FormattedDate} from 'react-intl'

const ShortDate = props => (
  <FormattedDate
    value={props.date}
    year="numeric"
    month="short"
    day="2-digit"
  />
)

export default ShortDate
```

Testing the `<ShortDate>` example component is no different than testing any other basic component in your app using React's shallow rendering:

```tsx
import expect from 'expect'
import expectJSX from 'expect-jsx'
import React from 'react'
import {createRenderer} from 'react-addons-test-utils'
import {FormattedDate} from 'react-intl'
import ShortDate from '../short-date'

expect.extend(expectJSX)

describe('<ShortDate>', function () {
  it('renders', function () {
    const renderer = createRenderer()
    const date = new Date()

    renderer.render(<ShortDate date={date} />)
    expect(renderer.getRenderOutput()).toEqualJSX(
      <FormattedDate value={date} year="numeric" month="short" day="2-digit" />
    )
  })
})
```

## DOM Rendering

If you use the DOM in your tests, you need to supply the `IntlProvider` context to your components using composition:

```tsx
let element = ReactTestUtils.renderIntoDocument(
  <IntlProvider>
    <MyComponent />
  </IntlProvider>
)
```

However this means that the `element` reference is now pointing to the `IntlProvider` instead of your component. To retrieve a reference to your wrapped component, you can use "refs" with these changes to the code:

In your component, remember to add `{forwardRef: true}` when calling `injectIntl()`:

```tsx
class MyComponent extends React.Component {
  ...
  myClassFn() { ... }
}
export default injectIntl(MyComponent, {forwardRef: true});
```

In your test, add a "ref" to extract the reference to your tested component:

```tsx
const element = React.createRef()
ReactTestUtils.renderIntoDocument(
  <IntlProvider>
    <MyComponent ref={element} />
  </IntlProvider>
)
```

You can now access the wrapped component instance from `element` like this:

```tsx
element.current.myClassFn()
```

### Helper function

Since you will have to do this in all your unit tests, you should probably wrap that setup in a `render` function like this:

```tsx
function renderWithIntl(element) {
  let instance

  ReactTestUtils.renderIntoDocument(
    <IntlProvider>
      {React.cloneElement(element, {
        ref: instance,
      })}
    </IntlProvider>
  )

  return instance
}
```

You can now use this in your tests like this:

```tsx
const element = React.createRef();
renderWithIntl(<MyElement ref={element}>);
element.current.myClassFn();
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

import React from 'react'
import {IntlProvider} from 'react-intl'
import {mount, shallow} from 'enzyme'

// You can pass your messages to the IntlProvider. Optional: remove if unneeded.
const messages = require('../locales/en') // en.json
const defaultLocale = 'en'
const locale = defaultLocale

export function mountWithIntl(node: React.ReactElement) {
  return mount(node, {
    wrappingComponent: IntlProvider,
    wrappingComponentProps: {
      locale,
      defaultLocale,
      messages,
    },
  })
}

export function shallowWithIntl(node: React.ReactElement) {
  return shallow(node, {
    wrappingComponent: IntlProvider,
    wrappingComponentProps: {
      locale,
      defaultLocale,
      messages,
    },
  })
}
```

### Usage

Create a file with the above helper in e.g. `helpers/intl-enzyme-test-helper.js` and `import` the methods you need in your tests.

```tsx
// intl-enzyme-test-helper.js

import {mountWithIntl} from 'helpers/intl-enzyme-test-helper.js'

const wrapper = mountWithIntl(<CustomComponent />)

expect(wrapper.state('foo')).to.equal('bar') // OK
expect(wrapper.text()).to.equal('Hello World!') // OK
```

Based on [this gist](https://gist.github.com/mirague/c05f4da0d781a9b339b501f1d5d33c37/).

## Jest

Testing with Jest can be divided into two approaches: snapshot's testing and DOM testing. Snapshot's testing is a relatively new feature and works out of the box. If you'd like DOM testing you need to use Enzyme or React's TestUtils.

### Snapshot Testing

Snapshot testing is a new feature of Jest that automatically generates text snapshots of your components and saves them on the disk so if the UI output changes, you get notified without manually writing any assertions on the component output. Use either helper function or mock as described below.

#### Helper function

```tsx
import React from 'react'
import renderer from 'react-test-renderer'
import {IntlProvider} from 'react-intl'

const createComponentWithIntl = (children, props = {locale: 'en'}) => {
  return renderer.create(<IntlProvider {...props}>{children}</IntlProvider>)
}

export default createComponentWithIntl
```

#### Usage

```tsx
import React from 'react'
import createComponentWithIntl from '../../utils/createComponentWithIntl'
import AppMain from '../AppMain'

test('app main should be rendered', () => {
  const component = createComponentWithIntl(<AppMain />)

  let tree = component.toJSON()

  expect(tree).toMatchSnapshot()

  tree.props.onClick()

  tree = component.toJSON()

  expect(tree).toMatchSnapshot()
})
```

You can find runnable example [here](https://github.com/formatjs/formatjs/tree/master/packages/react-intl/examples/jest-snapshot-testing) and more info about Jest [here](http://facebook.github.io/jest/).

#### Usage with Jest & enzyme

Jest will automatically mock react-intl, so no any extra implementation is needed, tests should work as is:

```tsx
import React from 'react'
import {shallow} from 'enzyme'
import AppMain from '../AppMain'

test('app main should be rendered', () => {
  const wrapper = shallow(<AppMain />)
  expect(wrapper).toMatchSnapshot()
})
```

### DOM Testing

If you want use Jest with DOM Testing read more info above in Enzyme section or in official Jest [documentation](http://facebook.github.io/jest/docs/tutorial-react.html#dom-testing).

## Storybook

### Intl

If you want to use `react-intl` inside of [Storybook](https://storybooks.js.org) you can use [`storybook-addon-intl`](https://github.com/truffls/storybook-addon-intl) which provides an easy to use wrapper for `react-intl` including a locale switcher so you can test your component in all provided languages.

## react-testing-library

In order to use `react-intl` and [`react-testing-library`](https://testing-library.com/docs/react-testing-library/intro) together, you should provide some helper function to the testing flow.

You can check the [docs](https://testing-library.com/docs/example-react-intl).

To create a generic solution, We can create a custom `render` function using
the `wrapper` option as explained in the
[setup](https://testing-library.com/docs/react-testing-library/setup) page.  
Our custom `render` function can look like this:

```jsx
// test-utils.js
import React from 'react'
import {render as rtlRender} from '@testing-library/react'
import {IntlProvider} from 'react-intl'

function render(ui, {locale = 'pt', ...renderOptions} = {}) {
  function Wrapper({children}) {
    return <IntlProvider locale={locale}>{children}</IntlProvider>
  }
  return rtlRender(ui, {wrapper: Wrapper, ...renderOptions})
}

// re-export everything
export * from '@testing-library/react'

// override render method
export {render}
```

```jsx
import React from 'react'
import '@testing-library/jest-dom/extend-expect'
// We're importing from our own created test-utils and not RTL's
import {render, screen} from '../test-utils.js'
import {FormattedDate} from 'react-intl'

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
  )
}

test('it should render FormattedDate and have a formated pt date', () => {
  render(<FormatDateView />)
  expect(screen.getByTestId('date-display')).toHaveTextContent('11/03/2019')
})
```
