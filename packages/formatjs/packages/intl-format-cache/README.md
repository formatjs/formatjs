Intl Format Cache
=================

A memoizer factory for Intl format constructors.

[![npm Version][npm-badge]][npm]
[![Build Status][travis-badge]][travis]
[![Dependency Status][david-badge]][david]


Overview
--------

This is a helper package used within [Yahoo's FormatJS suite][FormatJS]. It provides a factory for creating memoizers of [`Intl`][Intl] format constructors: [`Intl.NumberFormat`][Intl-NF], [`Intl.DateTimeFormat`][Intl-DTF], [`IntlMessageFormat`][Intl-MF], and [`IntlRelativeFormat`][Intl-RF].

Creating instances of these `Intl` formats is an expensive operation, and the APIs are designed such that developers should re-use format instances instead of always creating new ones. This package is simply to make it easier to create a cache of format instances of a particular type to aid in their reuse.

Under the hood, this package creates a cache key based on the arguments passed to the memoized constructor (it will even order the keys of the `options` argument) it uses `JSON.stringify()` to create the string key.


Usage
-----

This package works as an ES6 or Node.js module, in either case it has a single default export function; e.g.:

```js
// In an ES6 module.
import memoizeFormatConstructor from 'intl-format-cache';
```

```js
// In Node.
var memoizeFormatConstructor = require('intl-format-cache');
```

This default export is a factory function which can be passed an `Intl` format constructor and it will return a memoizer that will create or reuse an `Intl` format instance and return it.

```js
var getNumberFormat = memoizeFormatConstructor(Intl.NumberFormat);

var nf1 = getNumberFormat('en');
var nf2 = getNumberFormat('en');
var nf3 = getNumberFormat('fr');

console.log(nf1 === nf2); // => true
console.log(nf1 === nf3); // => false

console.log(nf1.format(1000)); // => "1,000"
console.log(nf3.format(1000)); // => "1 000"
```

# Benchmark

```
fast-memoize x 19,610 ops/sec ±1.86% (73 runs sampled)
intl-format-cache x 18,854 ops/sec ±4.95% (81 runs sampled)
--- NumberFormat cache set: Fastest is fast-memoize,intl-format-cache ---

fast-memoize x 1,051,977 ops/sec ±1.53% (89 runs sampled)
intl-format-cache x 1,134,171 ops/sec ±1.19% (91 runs sampled)
not cached x 23,002 ops/sec ±2.23% (83 runs sampled)
--- NumberFormat cache get: Fastest is intl-format-cache ---

fast-memoize x 6,466 ops/sec ±6.56% (72 runs sampled)
intl-format-cache x 7,384 ops/sec ±50.43% (64 runs sampled)
--- DateTimeFormat cache set: Fastest is fast-memoize ---

fast-memoize x 965,874 ops/sec ±17.87% (90 runs sampled)
intl-format-cache x 1,048,234 ops/sec ±0.79% (89 runs sampled)
not cached x 13,543 ops/sec ±2.61% (85 runs sampled)
--- DateTimeFormat cache get: Fastest is intl-format-cache ---

fast-memoize x 72,531 ops/sec ±26.27% (79 runs sampled)
intl-format-cache x 88,729 ops/sec ±0.51% (91 runs sampled)
--- IntlMessageFormat cache set: Fastest is intl-format-cache ---

fast-memoize x 665,420 ops/sec ±2.61% (90 runs sampled)
intl-format-cache x 649,186 ops/sec ±2.19% (90 runs sampled)
not cached x 127,110 ops/sec ±0.35% (91 runs sampled)
--- IntlMessageFormat cache get: Fastest is fast-memoize ---

fast-memoize x 1,294,591 ops/sec ±1.10% (94 runs sampled)
intl-format-cache x 1,905,746 ops/sec ±0.71% (91 runs sampled)
not cached x 152,118 ops/sec ±0.47% (94 runs sampled)
--- IntlMessageFormat cache get simple arg: Fastest is intl-format-cache ---
```

License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][LICENSE] for license text and copyright information.


[npm]: https://www.npmjs.org/package/intl-format-cache
[npm-badge]: https://img.shields.io/npm/v/intl-format-cache.svg?style=flat-square
[david]: https://david-dm.org/formatjs/intl-format-cache
[david-badge]: https://img.shields.io/david/formatjs/intl-format-cache.svg?style=flat-square
[travis]: https://travis-ci.org/formatjs/intl-format-cache
[travis-badge]: https://img.shields.io/travis/formatjs/intl-format-cache/master.svg?style=flat-square
[Intl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
[Intl-NF]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat
[Intl-DTF]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
[Intl-MF]: https://github.com/formatjs/formatjs
[Intl-RF]: https://github.com/formatjs/intl-relativeformat
[FormatJS]: http://formatjs.io/
[LICENSE]: https://github.com/formatjs/intl-format-cache/blob/master/LICENSE
