# `intl-unified-numberformat`

A ponyfill for [`intl-unified-numberformat`](https://github.com/tc39/proposal-unified-intl-numberformat). This wraps `Intl.NumberFormat` and has the exact same APIs.

## Installation

```
npm install @formatjs/intl-unified-numberformat
```

## Requirements

This package requires the following capabilities:

- [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/PluralRules)

# Usage

To use the ponyfill, import it along with its data:

```tsx
import {UnifiedNumberFormat} from '@formatjs/intl-unified-numberformat';
UnifiedNumberFormat.__addUnitLocaleData(
  'bit',
  ...require('../dist/locale-data/bit/zh') // locale-data for zh for unit `bit`
);
UnifiedNumberFormat.__addUnitLocaleData(
  'bit',
  ...require('../dist/locale-data/bit/en') // locale-data for zh for unit `bit`
);

new UnifiedNumberFormat('zh', {
  style: 'unit',
  unit: 'bit',
  unitDisplay: 'long',
}).format(1000); // 1,000比特
```
