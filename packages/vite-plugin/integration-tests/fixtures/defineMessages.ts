function defineMessages<T>(msgs: T): T {
  return msgs
}

export const messages = defineMessages({
  greeting: {
    defaultMessage: 'Hello {name}',
    description: 'Greeting with name',
  },
  farewell: {
    defaultMessage: 'Goodbye {name}',
    description: 'Farewell with name',
  },
})
