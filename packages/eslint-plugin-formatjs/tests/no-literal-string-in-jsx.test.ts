import noLiteralStringInJsx from '../rules/no-literal-string-in-jsx'
import {ruleTester} from './util'

ruleTester.run('no-literal-string-in-jsx', noLiteralStringInJsx, {
  valid: [
    {
      code: '<FormattedMessage defaultMessage="Test" />',
    },
    {
      code: '<div aria-label={f("label")} />',
    },
    {
      code: '<img alt={f("alt")} />',
    },
    {
      code: '<div>{f("message")}</div>',
    },
    // Conditional expression
    {
      code: '<div>{a ? b : c}</div>',
    },
    {
      code: '<div>{"a" ? b : c}</div>',
    },
    {
      code: '<div aria-label={a ? b : c} />',
    },
    // Excluded built-in img alt attribute check
    {
      code: '<img alt="alt" />',
      options: [
        {
          props: {
            exclude: [['img', 'alt']],
          },
        },
      ],
    },
    // Excluded built-in aria-label check.
    {
      code: `
        <>
          <Foo aria-label="test" />
          <Bar aria-label="test" />
        </>
      `,
      options: [
        {
          props: {
            exclude: [['*', 'aria-label']],
          },
        },
      ],
    },
    // Exclusion works on member expression and type parameters
    {
      code: '<UI.Button<T> aria-label="test" />',
      options: [
        {
          props: {
            exclude: [['*', 'aria-label']],
          },
        },
      ],
    },
    // Exclusion overrides inclusion
    {
      code: '<UI.Button<T> name="test" />',
      options: [
        {
          props: {
            include: [['*', 'name']],
            exclude: [['UI.Button', 'name']],
          },
        },
      ],
    },
    {
      code: '<input type="text" placeholder={f("foo")} aria-label={f("bar")} />',
    },
    {
      code: `
        <Component
          aria-label={intl.formatMessage({defaultMessage: "test"})}
          name={intl.formatMessage({defaultMessage: "test"})}
        >
          <FormattedMessage defaultMessage="test" />
        </Component>
      `,
      options: [
        {
          props: {
            include: [['Component', 'name']],
          },
        },
      ],
    },
    {
      // Ignores empty attributes (as string).
      code: '<img alt="" role="presentational" />',
    },
    {
      // Ignores empty attributes (as literal expression in the attribute value).
      code: '<img alt={""} role="presentational" />',
    },
    {
      // Ignores empty attributes (as template literal expression in the attribute value).
      code: '<img alt={``} role="presentational" />',
    },
  ],
  invalid: [
    {
      code: '<h1>Test</h1>',
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
    {
      code: '<img src="/example.png" alt="Example" />',
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
    {
      code: '<img src="/example.png" alt={"Example"} />',
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
    {
      code: '<img src="/example.png" alt={"Exa" + `mple`} />',
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    {
      code: '<img src="/example.png" alt={`Example`} />',
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
    {
      code: '<div title="title" />',
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
    {
      code: '<div title="title">text</div>',
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    {
      code: '<div aria-label="test">test</div>',
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    {
      code: '<div aria-description="test">test</div>',
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    {
      code: '<div>{"foo"}</div>',
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
    {
      code: `
        <div>
          {\`foo\` + x}
          bar
          {'baz' + 'qux'}
        </div>
      `,
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    {
      code: `
        <div>
          foo
          <div>
            bar
          </div>
        </div>
      `,
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    // Inclusion works
    {
      code: '<UI.Button<T> name="test" />',
      options: [
        {
          props: {
            include: [['UI.Button', 'name']],
          },
        },
      ],
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
    {
      code: '<UI.Button<T> name="test" />',
      options: [
        {
          props: {
            include: [['*', 'name']],
            // Exclude should match the entire member expression. So this one is a miss.
            exclude: [['Button', 'name']],
          },
        },
      ],
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
    // Multiple
    {
      code: '<UI.Button<T> aria-label={`label`} aria-description="description">Child</UI.Button>',
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    {
      code: '<input type="text" placeholder="foo" aria-label="bar" />',
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    // Conditional expression
    {
      code: '<div>{a ? "b" : "c"}</div>',
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    {
      code: '<div aria-label={a ? "b" : "c"} />',
      errors: [
        {message: 'Cannot have untranslated text in JSX'},
        {message: 'Cannot have untranslated text in JSX'},
      ],
    },
    {
      code: '<div aria-label={a ? b ? "c" : d : e} />',
      errors: [{message: 'Cannot have untranslated text in JSX'}],
    },
  ],
})
