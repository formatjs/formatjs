---
id: runtime-requirements
title: Runtime Requirements
---

## Browser

:::info Browser Support We support **IE11** & **2 most recent versions of Edge, Chrome, Firefox & Safari**. If you need older browser support, take a look at [polyfill-library](https://github.com/Financial-Times/polyfill-library) that also uses `formatjs` but pre-bundle other polyfills that we use. :::

React Intl relies on these `Intl` APIs:

- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat): Available on IE11+
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat): Available on IE11+
- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules): This can be polyfilled using [this package](polyfills/intl-pluralrules.md).
- (Optional) [Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RelativeTimeFormat): Required if you use [`formatRelativeTime`](react-intl/api.md#formatrelativetime) or [`FormattedRelativeTime`](react-intl/components.md#formattedrelativetime). This can be polyfilled using [this package](polyfills/intl-relativetimeformat.md).
- (Optional) [Intl.DisplayNames](https://tc39.es/proposal-intl-displaynames/): Required if you use [`formatDisplayName`](react-intl/api.md#formatdisplayname) or [`FormattedDisplayName`](react-intl/components.md#formatteddisplayname). This can be polyfilled using [this package](polyfills/intl-displaynames.md).

We officially support IE11 along with 2 most recent versions of Edge, Chrome & Firefox.

## Node.js

### full-icu

Starting with Node.js 13.0.0 full-icu is supported by default.

If using React Intl in an earlier version of Node.js, your `node` binary has to either:

- Get compiled with `full-icu` using these [instructions](https://nodejs.org/api/intl.html)

**OR**

- Uses [`full-icu` npm package](https://www.npmjs.com/package/full-icu)

If your `node` version is missing any of the `Intl` APIs above, you'd have to polyfill them accordingly.

## React Native

If you're using `react-intl` in React Native, make sure your runtime has built-in `Intl` support (similar to [JSC International variant](https://github.com/react-native-community/jsc-android-buildscripts#international-variant)). See these issues for more details:

- https://github.com/formatjs/formatjs/issues/1356
- https://github.com/formatjs/formatjs/issues/992

### React Native on iOS

If you cannot use the Intl variant of JSC (e.g on iOS), follow the instructions in [polyfills](./polyfills.md) to polyfill the following APIs (in this order):

1. [Intl.getCanonicalLocales](./polyfills/intl-getcanonicallocales.md)
2. [Intl.PluralRules](./polyfills/intl-pluralrules.md)
3. [Intl.NumberFormat](./polyfills/intl-numberformat.md)
4. [Intl.DateTimeFormat](./polyfills/intl-datetimeformat.md)
