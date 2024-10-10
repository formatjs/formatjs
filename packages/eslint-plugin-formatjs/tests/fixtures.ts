export const noMatch = {code: `_()`}
export const emptyFnCall = {
  code: `
import {defineMessage} from 'react-intl'
_()`,
}
export const spreadJsx = {
  code: `
import {FormattedMessage} from 'react-intl'
function foo (props) {
    return (
        <FormattedMessage {...props} />
    )
}
`,
}
export const dynamicMessage = {
  code: `
import {defineMessage} from 'react-intl'
defineMessage({id, defaultMessage, description})`,
}

export const defineMessage = {
  code: `\
import {defineMessage} from 'react-intl'
defineMessage({
    defaultMessage: 'a {placeholder}',
    description: 'asd'
})`,
}
