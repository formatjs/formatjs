export function _<T>(msg: T): T {
  return msg;
}

export function defineMessages<T>(msgs: Record<string, T>): Record<string, T> {
  return msgs;
}
