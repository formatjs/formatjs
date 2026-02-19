const intl = {
  formatMessage(descriptor: any) {
    return descriptor.defaultMessage
  },
}

export const greeting = intl.formatMessage({
  defaultMessage: 'Hello World',
  description: 'A greeting message',
})

export const farewell = intl.formatMessage({
  defaultMessage: 'Goodbye World',
  description: 'A farewell message',
})
