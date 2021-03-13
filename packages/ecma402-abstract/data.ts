class MissingLocaleDataError extends Error {
  public type = 'MISSING_LOCALE_DATA'
}

export function isMissingLocaleDataError(
  e: Error
): e is MissingLocaleDataError {
  return (e as MissingLocaleDataError).type === 'MISSING_LOCALE_DATA'
}
