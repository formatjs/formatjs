import {DisplayNames} from '.';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    const DisplayNames: DisplayNames;
  }
}

if (!Intl.DisplayNames) {
  Object.defineProperty(Intl, 'DisplayNames', {
    value: DisplayNames,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}
