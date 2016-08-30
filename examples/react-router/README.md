React Intl + React Router Example
=================================

This is a runnable example showing how to use React Intl with [React Router](https://github.com/reactjs/react-router).

This example app wraps the `<Router>` component with an `<IntlProvider>` and uses `<Formatted*>` components within the components the router will render.

## Running

**You first need to build the main React Intl library:**

```
$ cd ../..
$ npm run build
$ cd examples/react-router/
```

Then you can build and run this example:

```
$ npm run build
$ npm start
```

or you can edit the source in `index.js` and recompile the example on the fly :

```
$ npm run watch
$ npm start
```
