function defineMessage(message) {
  return message
}

export function greeting() {
  const text = 'Hello'
  return defineMessage({defaultMessage: text})
}
