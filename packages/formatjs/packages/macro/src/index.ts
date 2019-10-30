export function defineMessage<T>(msg: T): T {
  return msg;
}

export function defineMessages<T>(msgs: Record<string, T>): Record<string, T> {
  return msgs;
}

export const _ = defineMessage;
