import IntlRelativeTimeFormat from './';

declare global {
  namespace Intl {
    var RelativeTimeFormat: typeof IntlRelativeTimeFormat;
  }
}
export default function fixMeta(
  RelativeTimeFormat: typeof IntlRelativeTimeFormat
) {
  if (typeof Intl.RelativeTimeFormat !== 'undefined') {
    return;
  }
  Object.defineProperty(Intl, 'RelativeTimeFormat', {
    value: RelativeTimeFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  });

  Object.defineProperty(RelativeTimeFormat, 'supportedLocalesOf', {
    writable: true,
    enumerable: false,
    configurable: true,
  });

  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(RelativeTimeFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.RelativeTimeFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  Object.defineProperty(RelativeTimeFormat.prototype, 'format', {
    writable: true,
    enumerable: false,
    configurable: true,
  });

  Object.defineProperty(RelativeTimeFormat.prototype, 'formatToParts', {
    writable: true,
    enumerable: false,
    configurable: true,
  });

  Object.defineProperty(RelativeTimeFormat.prototype, 'resolvedOptions', {
    writable: true,
    enumerable: false,
    configurable: true,
  });

  Object.defineProperty(Intl.RelativeTimeFormat, 'prototype', {
    writable: false,
    enumerable: false,
    configurable: false,
  });

  try {
    // This is bc transpilation process sets class properties to anonymous function
    Object.defineProperty(
      RelativeTimeFormat.prototype.resolvedOptions,
      'name',
      {
        value: 'resolvedOptions',
      }
    );

    Object.defineProperty(RelativeTimeFormat.prototype.format, 'name', {
      value: 'format',
    });

    Object.defineProperty(RelativeTimeFormat.prototype.formatToParts, 'name', {
      value: 'formatToParts',
    });

    Object.defineProperty(RelativeTimeFormat.supportedLocalesOf, 'name', {
      value: 'supportedLocalesOf',
    });
  } catch (ex) {
    // This crashes due to a bug in JSC on iOS 9. We can safely ignore the error.
    // See https://github.com/formatjs/formatjs/issues/128.
  }
}
