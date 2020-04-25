---
id: intl-displaynames
title: Intl.DisplayNames
---

A ponyfill/polyfill for [`Intl.DisplayNames`](https://tc39.es/proposal-intl-displaynames).

## Installation

```
npm install @formatjs/intl-displaynames
```

# Features

Everything in <https://github.com/tc39/proposal-intl-displaynames>.

# Usage

To use the ponyfill, import it along with its data:

```ts
import {DisplayNames} from '@formatjs/intl-displaynames';
DisplayNames.__addLocaleData(
  require('@formatjs/intl-displaynames/dist/locale-data/en.json') // locale-data for en
);
DisplayNames.__addLocaleData(
  require('@formatjs/intl-displaynames/dist/locale-data/zh.json') // locale-data for zh
);

new DisplayNames('zh', {type: 'currency'}).of('USD'); //=> "美元"
```

To use this as a polyfill, override `Intl.DisplayNames` as below:

```javascript
import '@formatjs/intl-displaynames/polyfill';
import '@formatjs/intl-displaynames/dist/locale-data/en'; // locale-data for en
import '@formatjs/intl-displaynames/dist/locale-data/zh'; // locale-data for zh

new Intl.DisplayNames('en').of('zh-Hans'); //=> "Simplified Chinese"
new Intl.DisplayNames('zh', {type: 'currency'}).of('USD'); //=> "美元"
```
