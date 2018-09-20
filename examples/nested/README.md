React Intl Nested Example
=========================

This is a runnable example showing how to use React Intl with nested collections of string messages from different "widgets" that could be defined in separate npm packages and combined in one app.

This example app creates a string messages bundle per logical widget in the app via the `scripts/group-messages.js` script.

## Running

**You first need to build the main React Intl library:**

```
$ cd ../..
$ npm run build
$ cd examples/nested/
```

Then you can build and run this example:

```
$ npm run build
$ npm start
```

or you can edit any source in `src/client/` and recompile the example on fly :

```
$ npm run watch
$ npm start
```
