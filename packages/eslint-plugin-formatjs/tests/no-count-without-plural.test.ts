import {
  name,
  rule,
} from '#packages/eslint-plugin-formatjs/rules/no-count-without-plural.js'
import {
  defineMessage,
  dynamicMessage,
  emptyFnCall,
  noMatch,
  spreadJsx,
} from '#packages/eslint-plugin-formatjs/tests/fixtures'
import {ruleTester} from '#packages/eslint-plugin-formatjs/tests/util'

const message = (defaultMessage: string) => `
  import {defineMessage} from 'react-intl'
  defineMessage({defaultMessage: ${JSON.stringify(defaultMessage)}})
`

const errors = [{messageId: 'countWithoutPlural'}]

ruleTester.run(name, rule, {
  valid: [
    defineMessage,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    message('{count, plural, one {# source} other {# sources}}'),
    // The selector's display form inside its own plural.
    message('{count, plural, one {{quantity} unit} other {{quantity} units}}'),
    message(
      'Showing {visibleCount, number} of {count, plural, one {# PR} other {# PRs}}'
    ),
    // Money and identifiers are not counts.
    message('You get {amount} of free credits'),
    message('Open issue #{number}'),
    // Units and verbs after a count.
    message('up to {maxCount, number} MB'),
    message('{count} is the limit'),
    message('{count, number}'),
    {
      code: message('{seats} seats left'),
      options: [{countPattern: '^count$'}],
    },
  ],
  invalid: [
    {code: message('{count} sources'), errors},
    {code: message('{count} models selected'), errors},
    {code: message('You can attach up to {maxCount, number} files.'), errors},
    {code: message('Downloaded {succeeded} of {total} artifacts'), errors},
    {code: message('{count, number} {label}'), errors},
    {
      code: message('{kind, select, file {{fileCount} files} other {}}'),
      errors,
    },
    {
      code: `
        import {FormattedMessage} from 'react-intl'
        const x = <FormattedMessage defaultMessage="View diff ({count} lines changed)" />
      `,
      errors,
    },
    {
      code: message('{seats} seats left'),
      options: [{countPattern: '^seats$'}],
      errors,
    },
  ],
})
