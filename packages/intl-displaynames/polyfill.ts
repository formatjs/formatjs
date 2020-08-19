import {DisplayNames, DisplayNamesOptions} from '.';
import {shouldPolyfill} from './should-polyfill';
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    const DisplayNames: {
      new (
        locales?: string | string[],
        options?: DisplayNamesOptions
      ): DisplayNames;

      readonly polyfilled?: true;
    };
  }
}

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'DisplayNames', {
    value: DisplayNames,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}
