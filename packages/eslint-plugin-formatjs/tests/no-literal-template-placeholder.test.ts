import {
  name,
  rule,
} from '#packages/eslint-plugin-formatjs/rules/no-literal-template-placeholder.js'
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

const invalid = (defaultMessage: string, ...tokens: string[]) => ({
  code: message(defaultMessage),
  errors: tokens.map(token => ({
    messageId: 'literalTemplatePlaceholder',
    data: {token},
  })),
})

ruleTester.run(name, rule, {
  valid: [
    defineMessage,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    message('Its recent {direction} to {price, number, ::currency/USD}'),
    // Nested ICU arguments inside plural branches are not mustache tokens.
    message('{others, plural, =0 {{first}} other {{first} & # more}}'),
    message("Type '{' to open a block"),
    message('50% off, 100%'),
    message('{ratio, number, ::percent} of users'),
    message('Use %PATH% on Windows'),
    message('Escaped %%s, %%d, %%@ and %%%%s'),
  ],
  invalid: [
    invalid(
      "Its recent '{{direction}}' to '{{event_value}}'.",
      '{{direction}}',
      '{{event_value}}'
    ),
    invalid("Hello '{{ user.name }}'", '{{ user.name }}'),
    invalid('Uploaded %s of %d files', '%s', '%d'),
    invalid('Hello %(name)s', '%(name)s'),
    invalid('Item %1$s', '%1$s'),
    invalid('已上传%s个文件', '%s'),
    invalid('Ranked %dth', '%d'),
    invalid('%@님', '%@'),
    invalid('prefix%1$sSuffix', '%1$s'),
    invalid('Hello%(name)sWorld', '%(name)s'),
    invalid('Escaped percent then placeholder: %%%s', '%s'),
    invalid(
      "{count, plural, one {# alert for '{{symbol}}'} other {# alerts for '{{symbol}}'}}",
      '{{symbol}}'
    ),
    invalid("<b>'{{name}}'</b> joined", '{{name}}'),
    {
      code: `
        import {FormattedMessage} from 'react-intl'
        const x = <FormattedMessage defaultMessage="Hi '{{name}}'" />
      `,
      errors: [{messageId: 'literalTemplatePlaceholder'}],
    },
  ],
})
