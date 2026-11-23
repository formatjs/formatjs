// ECMA-262 §20.1.2.4 steps 2–4. Install the selected prototype accessors.
export function defineGetters<K extends string>(
  prototype: object,
  names: readonly K[],
  read: (receiver: unknown, name: K, index: number) => unknown
): void {
  // ECMA-262 §20.1.2.8 steps 3–4 and §20.1.2.4 steps 2–4.
  // Read the getter and install it with its own captures.
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
