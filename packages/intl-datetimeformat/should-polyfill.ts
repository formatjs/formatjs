function supportsDateStyle() {
  return !!(new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
  } as any).resolvedOptions() as any).dateStyle;
}

/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=865351
 */
function hasChromeLt71Bug() {
  return (
    new Intl.DateTimeFormat('en', {
      hourCycle: 'h11',
      hour: 'numeric',
    } as any).formatToParts(0)[2].type !== 'dayPeriod'
  );
}

export function shouldPolyfill() {
  return (
    !('DateTimeFormat' in Intl) ||
    !('formatToParts' in Intl.DateTimeFormat.prototype) ||
    hasChromeLt71Bug() ||
    !supportsDateStyle()
  );
}
