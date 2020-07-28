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

/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1097432
 */
function hasMissingICUBug() {
  if (Intl.DisplayNames) {
    const regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
    return regionNames.of('CA') === 'CA';
  }
  return false;
}

if (!Intl.DisplayNames || hasMissingICUBug()) {
  Object.defineProperty(Intl, 'DisplayNames', {
    value: DisplayNames,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}
