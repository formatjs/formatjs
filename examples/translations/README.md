React Intl Translations Example
===============================

This is a runnable example showing how to use React Intl and the `babel-plugin-react-intl` to extract string messages from components so that they can be translated.

This example app fakes translation via the `scripts/translate.js` script which "translates" the default English string messages to the `en-UPPER` "locale" — it simply uppercases all of the message text.

## Running

**You first need to build the main React Intl library:**

```
$ cd ../..
$ npm run build
$ cd examples/translations/
```

Then you can build and run this example:

```
$ npm run build
$ npm start
```

or you can edit any source in `src/client` and recompile the example on the fly:

```
$ npm run watch
$ npm start
```
