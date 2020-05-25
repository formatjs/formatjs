import {DisplayNames, DisplayNamesOptions} from '.';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    const DisplayNames: {
      new (
        locales?: string | string[],
        options?: DisplayNamesOptions
      ): DisplayNames;
    };
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
