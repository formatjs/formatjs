import {
  name,
  rule,
} from '#packages/eslint-plugin-formatjs/rules/no-literal-number-symbol.js'
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

const invalid = (defaultMessage: string, ...messageIds: string[]) => ({
  code: message(defaultMessage),
  errors: messageIds.map(messageId => ({messageId})),
})

ruleTester.run(name, rule, {
  valid: [
    defineMessage,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
    message('Price drops {ratio, number, ::percent .##}+'),
    message('{ratio, number, percent} done'),
    message('{ratio, number, ::permille}'),
    message('Save 100% of your time'),
    message('{amount, number, ::currency/USD .00/w sign-always} bonus credits'),
    message('{delta, number, ::+! .0} today'),
    message('{price, number, currency}/mo'),
    message('{temp, number, ::unit/celsius}'),
    message('{count, plural, one {+# more} other {+# more}}'),
    // Ranges, arithmetic and "or more" are not signs.
    message('Pages {start}-{end}'),
    message('{a} + {b} = {sum}'),
    message('{count}+ sources'),
    message('Step {step} - {title}'),
  ],
  invalid: [
    invalid('Price drops {ratio}%+', 'literalPercent'),
    invalid('target {weight, number} %', 'literalPercent'),
    invalid('Yüzde %{value}', 'literalPercent'),
    invalid('{ratio, number, ::compact-short}%', 'literalPercent'),
    invalid('<b>{value}%</b> done', 'literalPercent'),
    invalid('{up, select, true {Up {delta}٪} other {Down}}', 'literalPercent'),
    invalid('{rate}‰ of requests', 'literalPermille'),
    invalid('+{amount} bonus credits', 'literalSign'),
    invalid('Change: −{delta, number}', 'literalSign'),
    invalid('-{discount} off', 'literalSign'),
    invalid('({delta, number, ::percent} vs. -{prev})', 'literalSign'),
    invalid('${price}/mo', 'literalCurrency'),
    invalid('{price} €', 'literalCurrency'),
    invalid('{price, number, ::percent}¥', 'literalCurrency'),
    invalid('{temp}°C outside', 'literalDegree'),
    invalid('{angle, number}°', 'literalDegree'),
    invalid('+{delta}%', 'literalPercent', 'literalSign'),
    {
      code: `
        import {FormattedMessage} from 'react-intl'
        const x = <FormattedMessage defaultMessage="{percent}% read" />
      `,
      errors: [{messageId: 'literalPercent'}],
    },
  ],
})
