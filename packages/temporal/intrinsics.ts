// Internal allocation must not call a replacement installed by user code.
export const createObject: typeof Object.create = Object.create

const ProxyConstructor = Proxy
const setPrototypeOf = Object.setPrototypeOf

// Proxy supplies a dense array for its private argument List.
export function argumentAt(args: readonly unknown[], index: number): unknown {
  return index < args.length ? args[index] : undefined
}

// Callers supply fresh, private handler literals; absent traps have no prototype.
export function createProxy<T extends object>(
  target: T,
  handler: ProxyHandler<T>
): T {
  setPrototypeOf(handler, null)
  return new ProxyConstructor(target, handler)
}
