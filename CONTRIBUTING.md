# Contributing

## Submitting a pull request
1. Read the [contributor license agreement](https://yahoocla.herokuapp.com/)

2. [Fork][fork] the repository.

3. Ensure that all tests are passing prior to submitting. Usage: `grunt sauce`.

4. If you are adding new functionality, or fixing a bug, provide test coverage.

5. Follow syntax guidelines detailed below.

6. Push the changes to your fork and submit a pull request.  If this resolves any issues, please mark in the body `resolve #ID` within the body of your pull request.  This allows for github to automatically close the related issue once the pull request is merged.

7. Last step, [submit the pull request][pr]!

[pr]: https://github.com/yahoo/react-intl/compare/
[fork]: https://github.com/yahoo/react-intl/fork/

## Reporting a Bug
1. Ensure you've replicated the issue against master.  There is a chance the issue may have already been fixed.

2. Search for any similar issues (both opened and closed).  There is a chance someone may have reported it already.

3. Provide a demo of the bug isolated in a jsfiddle/jsbin.  Sometimes this is not a possibility, in which case provide a detailed description along with any code snippits that would help in triaging the issue.  If we cannot reproduce it, we will close it.

4. The best way to demonstrate a bug is to build a failing test.  This is not required, however, it will generally speed up the development process.

## Syntax guidelines

1. Use the existing source as a benchmark for syntax guidelines.

2. Four spaces, no tabs.

3. `var foo = 'bar';` NOT `var foo='bar';`

4. Vertically align assignment &amp; assignment operators:

```js
var foo   = 'bar';
var bar   = 'baz';
var hello = 'world';

// AND

{
  displayName: 'foo',
  hello:       'world'
}
```

5. Semicolons.

6. Break up var statements:
```js
var foo   = 'bar';
var bar   = 'baz';

// NOT

var foo = 'bar', bar = 'baz';
```
