export function _<T>(msg: T): T {
  return msg;
}

export function defineMessages<T, U extends Record<string, T>>(msgs: U): U {
  return msgs;
}
