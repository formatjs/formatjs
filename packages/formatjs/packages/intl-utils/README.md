# Intl Utils

Provide i18n utilities.

[![npm Version][npm-badge]][npm]

## API

### selectUnit

This function determines the `best fit` unit based on a specific set of customizable thresholds.

```ts
function selectUnit(
  from: Date | number,
  to: Date | number = Date.now(),
  thresholds = DEFAULT_THRESHOLDS
): {value: number; unit: Unit};
```

where `thresholds` has the shape of:

```ts
interface Threshold {
  second: number;
  minute: number;
  hour: number;
  day: number;
}
```

`month` & `year` are based on calendar, thus not customizable.

Example:

```ts
import {selectUnit} from '@formatjs/intl-utils';
selectUnit(Date.now() - 1000); // { value: -1, unit: 'second' }
selectUnit(Date.now() - 44000); // { value: -44, unit: 'second' }
selectUnit(Date.now() - 50000); // { value: 1, unit: 'minute' }
```

[npm]: https://www.npmjs.org/package/@formatjs/intl-utils
[npm-badge]: https://img.shields.io/npm/v/@formatjs/intl-utils.svg?style=flat-square
