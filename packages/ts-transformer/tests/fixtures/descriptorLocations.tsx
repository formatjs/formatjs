import {defineMessages, FormattedMessage} from 'react-intl'

const dedent = String.raw
const commonMessages = {}
const objectSpread = {}
const jsxSpread = {}

export const messages = defineMessages({
  ...commonMessages,
  object: {
    id: 'duplicate',
    defaultMessage: 'Object message' satisfies string,
  },
  template: {
    id: `template-id`,
    defaultMessage: `Template message`,
  },
  concat: {
    id: 'concat',
    defaultMessage: 'Concat ' + 'message',
  },
  tagged: {
    id: 'tagged',
    defaultMessage: dedent`Tagged message`,
  },
  spread: {
    id: 'object-spread',
    defaultMessage: 'Object spread message',
    ...objectSpread,
  },
})

export const jsx = (
  <>
    <FormattedMessage id="duplicate" defaultMessage='JSX "message"' />
    <FormattedMessage
      id={'expression'}
      defaultMessage={'Expression message' as string}
    />
    <FormattedMessage
      id="jsx-spread"
      defaultMessage="JSX spread message"
      {...jsxSpread}
    />
  </>
)
