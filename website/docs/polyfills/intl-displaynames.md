---
id: intl-displaynames
title: Intl.DisplayNames
---

A polyfill for [`Intl.DisplayNames`](https://tc39.es/proposal-intl-displaynames).

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-displaynames.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-displaynames)
![size](https://badgen.net/bundlephobia/minzip/@formatjs/intl-displaynames)

## Installation

```
npm install @formatjs/intl-displaynames
```

## Requirements

If you're supporting IE11-, this requires [`Intl.getCanonicalLocales`](intl-getcanonicallocales.md).

## Features

Everything in <https://github.com/tc39/proposal-intl-displaynames>.

## Usage

To use this as a polyfill, override `Intl.DisplayNames` as below:

```javascript
import '@formatjs/intl-displaynames/polyfill';
import '@formatjs/intl-displaynames/locale-data/en'; // locale-data for en
import '@formatjs/intl-displaynames/locale-data/zh'; // locale-data for zh

new Intl.DisplayNames('en').of('zh-Hans'); //=> "Simplified Chinese"
new Intl.DisplayNames('zh', {type: 'currency'}).of('USD'); //=> "美元"
```
