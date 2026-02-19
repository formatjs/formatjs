function defineMessage<T>(msg: T): T {
  return msg
}

export const msg = defineMessage({
  defaultMessage: 'You have {count, plural, one {# item} other {# items}}',
  description: 'Item count',
})
