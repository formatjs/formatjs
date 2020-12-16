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

/**
 * Node 14's version of Intl.DateTimeFormat does not throw
 * when dateStyle/timeStyle is used with other options.
 * This was fixed in newer V8 versions
 */
function hasUnthrownDateTimeStyleBug(): boolean {
  try {
    return !!new Intl.DateTimeFormat('en', {
      dateStyle: 'short',
      hour: 'numeric',
    } as any).format(new Date(0));
  } catch (e) {
    return false;
  }
}

export function shouldPolyfill() {
  return (
    !('DateTimeFormat' in Intl) ||
    !('formatToParts' in Intl.DateTimeFormat.prototype) ||
    hasChromeLt71Bug() ||
    hasUnthrownDateTimeStyleBug() ||
    !supportsDateStyle()
  );
}
