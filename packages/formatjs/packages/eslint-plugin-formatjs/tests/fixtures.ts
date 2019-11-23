export const noMatch = `_()`;
export const emptyFnCall = `
import {_} from '@formatjs/macro'
_()`;
export const spreadJsx = `
import {FormattedMessage} from 'react-intl'
function foo (props) {
    return (
        <FormattedMessage {...props} />
    )
}
`;
