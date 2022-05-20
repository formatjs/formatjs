export function foo() {
  props.intl.formatMessage(
    {
      defaultMessage: 'props {intl}',
      description: 'bar',
    },
    {bar: 'bar'}
  )
  this.props.intl.formatMessage(
    {
      defaultMessage: 'this props {intl}',
      description: 'bar',
    },
    {bar: 'bar'}
  )
  this.props.intl.formatMessage(
    {
      defaultMessage: 'this props {intl}',
      description: {
        obj1: 1,
        obj2: '123',
      },
    },
    {bar: 'bar'}
  )
  this.props.intl.formatMessage(
    {
      defaultMessage: 'this props {intl}',
      description: {
        obj2: '123',
        obj1: 1,
      },
    },
    {bar: 'bar'}
  )
  this.props.intl.formatMessage(
    {
      defaultMessage: 'this props {intl}',
      description: {
        obj2: '123',
      },
    },
    {bar: 'bar'}
  )
  return intl.formatMessage(
    {
      defaultMessage: 'foo {bar}',
      description: 'bar',
    },
    {bar: 'bar'}
  )
}
