import RelativeTimeFormat from './src/core';
if (!('RelativeTimeFormat' in Intl)) {
  Object.defineProperty(Intl, 'RelativeTimeFormat', {
    value: RelativeTimeFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
