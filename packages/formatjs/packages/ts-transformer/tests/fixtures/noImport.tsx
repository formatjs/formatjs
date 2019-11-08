export function foo () {
    props.intl.formatMessage({
        defaultMessage: 'props {intl}',
        description: 'bar'
    }, {bar: 'bar'})
    this.props.intl.formatMessage({
        defaultMessage: 'this props {intl}',
        description: 'bar'
    }, {bar: 'bar'})
    return intl.formatMessage({
        defaultMessage: 'foo {bar}',
        description: 'bar'
    }, {bar: 'bar'})
}