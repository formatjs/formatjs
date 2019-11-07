export function foo () {
    return intl.formatMessage({
        defaultMessage: 'foo {bar}',
        description: 'bar'
    }, {bar: 'bar'})
}