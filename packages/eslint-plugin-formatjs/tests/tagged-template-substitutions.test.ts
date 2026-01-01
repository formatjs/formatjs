/**
 * Test for GH #5069: Tagged template expressions with substitutions
 * should be allowed in non-message props like tagName, values, etc.
 */
import {name, rule} from '../rules/no-invalid-icu.js'
import {ruleTester} from './util'

ruleTester.run(name + ' (GH #5069 - tagged templates)', rule, {
  valid: [
    {
      code: `
        <FormattedMessage
          id="someid"
          defaultMessage="Some Default Message"
          tagName={styled("div")\`
            color: \${blackColor};
          \`}
        />
      `,
    },
    {
      code: `
        <FormattedMessage
          id="someid"
          defaultMessage="Some Default Message"
          tagName={css\`font-size: \${fontSize}px;\`}
        />
      `,
    },
    {
      code: `
        intl.formatMessage({
          id: 'someid',
          defaultMessage: 'Some Message',
          tagName: styled("div")\`color: \${color};\`
        })
      `,
    },
    {
      code: `
        <FormattedMessage
          id="someid"
          defaultMessage="Some Default Message"
          values={{
            component: styled("span")\`font-weight: \${weight};\`
          }}
        />
      `,
    },
    // dedent without substitutions should still work
    {
      code: `
        <FormattedMessage
          id={dedent\`someid\`}
          defaultMessage={dedent\`Some Default Message\`}
          description={dedent\`Some description\`}
        />
      `,
    },
  ],
  invalid: [
    // Tagged templates with substitutions in message props should still fail
    {
      code: `
        <FormattedMessage
          id={dedent\`some\${id}\`}
          defaultMessage="message"
        />
      `,
      errors: [
        {
          messageId: 'parseError',
          data: {
            error: 'Tagged template expression must be no substitution',
          },
        },
      ],
    },
    {
      code: `
        <FormattedMessage
          id="someid"
          defaultMessage={dedent\`message \${value}\`}
        />
      `,
      errors: [
        {
          messageId: 'parseError',
          data: {
            error: 'Tagged template expression must be no substitution',
          },
        },
      ],
    },
    {
      code: `
        <FormattedMessage
          id="someid"
          defaultMessage="message"
          description={dedent\`description \${value}\`}
        />
      `,
      errors: [
        {
          messageId: 'parseError',
          data: {
            error: 'Tagged template expression must be no substitution',
          },
        },
      ],
    },
    {
      code: `
        intl.formatMessage({
          id: dedent\`id\${value}\`,
          defaultMessage: 'message'
        })
      `,
      errors: [
        {
          messageId: 'parseError',
          data: {
            error: 'Tagged template expression must be no substitution',
          },
        },
      ],
    },
  ],
})
