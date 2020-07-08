export const noMatch = `_()`;
export const emptyFnCall = `
import {defineMessage} from 'react-intl'
_()`;
export const spreadJsx = `
import {FormattedMessage} from 'react-intl'
function foo (props) {
    return (
        <FormattedMessage {...props} />
    )
}
`;
export const dynamicMessage = `
import {defineMessage} from 'react-intl'
defineMessage({id, defaultMessage, description})`;
