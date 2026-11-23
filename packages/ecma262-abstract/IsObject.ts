/** Includes browser host objects such as document.all. */
export function IsObject(value: unknown): value is object {
  return (
    value !== null &&
    (typeof value === 'object' ||
      typeof value === 'function' ||
      (typeof value === 'undefined' && value !== undefined))
  )
}
