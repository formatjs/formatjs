import {name, rule} from '../rules/prefer-full-sentence.js'
import {
  defineMessage,
  dynamicMessage,
  emptyFnCall,
  noMatch,
  spreadJsx,
} from './fixtures'
import {ruleTester} from './util'

ruleTester.run(name, rule, {
  valid: [
    defineMessage,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: 'Hello world'
      })
    `,
    },
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: 'Hello {name}'
      })
    `,
    },
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: '{count} items'
      })
    `,
    },
    // Plural branches without leading/trailing whitespace
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: '{count, plural, one {# item} other {# items}}'
      })
    `,
    },
    // Select branches without leading/trailing whitespace
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: '{gender, select, male {He said} female {She said} other {They said}}'
      })
    `,
    },
    // Message with only whitespace (edge case — ignored)
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: ' '
      })
    `,
    },
  ],
  invalid: [
    // Leading whitespace
    {
      code: `import {defineMessage} from 'react-intl';defineMessage({defaultMessage: ' Hello world'})`,
      errors: [{messageId: 'leadingWhitespace'}],
    },
    // Trailing whitespace
    {
      code: `import {defineMessage} from 'react-intl';defineMessage({defaultMessage: 'Hello world '})`,
      errors: [{messageId: 'trailingWhitespace'}],
    },
    // Both leading and trailing whitespace
    {
      code: `import {defineMessage} from 'react-intl';defineMessage({defaultMessage: ' Hello world '})`,
      errors: [
        {messageId: 'leadingWhitespace'},
        {messageId: 'trailingWhitespace'},
      ],
    },
    // Leading whitespace before placeholder
    {
      code: `import {defineMessage} from 'react-intl';defineMessage({defaultMessage: ' {name} said hello'})`,
      errors: [{messageId: 'leadingWhitespace'}],
    },
    // Trailing whitespace after placeholder
    {
      code: `import {defineMessage} from 'react-intl';defineMessage({defaultMessage: 'Hello {name} '})`,
      errors: [{messageId: 'trailingWhitespace'}],
    },
    // JSX
    {
      code: `<FormattedMessage defaultMessage=" hello" />`,
      errors: [{messageId: 'leadingWhitespace'}],
    },
    // Template literal
    {
      code: `import {defineMessage} from 'react-intl';defineMessage({defaultMessage: \` hello\`})`,
      errors: [{messageId: 'leadingWhitespace'}],
    },
    // Leading whitespace inside plural branch
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: '{count, plural, one { # item} other {# items}}'
      })
    `,
      errors: [{messageId: 'leadingWhitespace'}],
    },
    // Trailing whitespace inside select branch
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: '{gender, select, male {He said } other {They said}}'
      })
    `,
      errors: [{messageId: 'trailingWhitespace'}],
    },
  ],
})
