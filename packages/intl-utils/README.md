# Intl Utils

Provide i18n utilities.

[![npm Version](https://img.shields.io/npm/v/@formatjs/intl-utils.svg?style=flat-square)](https://www.npmjs.org/package/@formatjs/intl-utils)

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

#### Caveats

`selectUnit` is meant to be a stepping stone from the old `IntlRelativeFormat` to the officially spec-ed `Intl.RelativeTimeFormat`. Therefore we don't recommend using this for an extended period of time because of ambiguous editorial issues such as:

- From 2019/01/01 -> 2018/11/01 can technically be `last year`, `2 months ago` or `a quarter ago`.

- From 2019/01/02 6am to 2019/01/01 11pm can also be `7 hours ago` or `yesterday`. Timezone further complicates the issue.

The examples above have not even tackled the differences in non-Gregorian calendars. There is an issue opened upstream in the spec that potentially introduces a [`best fit` algorithm](https://github.com/tc39/proposal-intl-relative-time/issues/47). Therefore, we recommend that you implement your own version of `selectUnit` that matches your editorial expectation. This will be removed in future releases.
