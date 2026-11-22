export function defineGetters<K extends string>(
  prototype: object,
  names: readonly K[],
  read: (receiver: unknown, name: K, index: number) => unknown
): void {
  // Keep each getter's captures in its own call scope.
  function define(name: K, index: number): void {
    const accessor = {
      // Temporal comparison §3.3.6 steps 1, 2, 3.
      // Forward the receiver and selected field to the accessor reader.
      get [name](): unknown {
        return read(this, name, index)
      },
    }
    Object.defineProperty(prototype, name, {
      get: Object.getOwnPropertyDescriptor(accessor, name)!.get,
      configurable: true,
      enumerable: false,
    })
  }
  for (let index = 0; index < names.length; index++) define(names[index], index)
}
