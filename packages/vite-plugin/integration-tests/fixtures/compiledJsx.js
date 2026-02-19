import {FormattedMessage} from 'react-intl'
import {jsx as _jsx} from 'react/jsx-runtime'

export function App() {
  return _jsx('div', {
    children: [
      _jsx(FormattedMessage, {
        defaultMessage: 'Welcome to our app',
        description: 'Welcome message',
      }),
      _jsx(FormattedMessage, {
        id: 'custom.id',
        defaultMessage: 'Custom ID message',
        description: 'Has a custom ID',
      }),
    ],
  })
}
