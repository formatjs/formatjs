import {rule, name} from '../rules/no-literal-string-in-jsx.js'
import {ruleTester} from './util'

ruleTester.run(name, rule, {
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
    // Logical expression
    {
      code: '<div>{a && b}</div>',
    },
    {
      code: '<div>{a || b}</div>',
    },
    {
      code: '<div>{a ?? b}</div>',
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
    // Exclude children of specific elements
    {
      code: '<MenubarShortcut>Ctrl+C</MenubarShortcut>',
      options: [
        {
          props: {
            exclude: [['MenubarShortcut', 'children']],
          },
        },
      ],
    },
    {
      code: '<MenubarShortcut>{"Ctrl+C"}</MenubarShortcut>',
      options: [
        {
          props: {
            exclude: [['MenubarShortcut', 'children']],
          },
        },
      ],
    },
    {
      code: '<MenubarShortcut>{`Ctrl+C`}</MenubarShortcut>',
      options: [
        {
          props: {
            exclude: [['MenubarShortcut', 'children']],
          },
        },
      ],
    },
    // Exclude children with wildcard pattern
    {
      code: '<Kbd>Ctrl+C</Kbd>',
      options: [
        {
          props: {
            exclude: [['*', 'children']],
          },
        },
      ],
    },
    // Exclude children of specific pattern
    {
      code: '<UI.Shortcut>Ctrl+C</UI.Shortcut>',
      options: [
        {
          props: {
            exclude: [['UI.*', 'children']],
          },
        },
      ],
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
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<img src="/example.png" alt="Example" />',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<img src="/example.png" alt={"Example"} />',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<img src="/example.png" alt={"Exa" + `mple`} />',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    {
      code: '<img src="/example.png" alt={`Example`} />',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<div title="title" />',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<div title="title">text</div>',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    {
      code: '<div aria-label="test">test</div>',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    {
      code: '<div aria-description="test">test</div>',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    {
      code: '<div>{"foo"}</div>',
      errors: [{messageId: 'noLiteralStringInJsx'}],
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
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
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
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
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
      errors: [{messageId: 'noLiteralStringInJsx'}],
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
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    // Multiple
    {
      code: '<UI.Button<T> aria-label={`label`} aria-description="description">Child</UI.Button>',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    {
      code: '<input type="text" placeholder="foo" aria-label="bar" />',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    // Conditional expression
    {
      code: '<div>{a ? "b" : "c"}</div>',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    {
      code: '<div aria-label={a ? "b" : "c"} />',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    {
      code: '<div aria-label={a ? b ? "c" : d : e} />',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    // Logical expression
    {
      code: '<div>{a && "a"}</div>',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<div>{"a" && a}</div>',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<div>{a || "a"}</div>',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<div>{a ?? "a"}</div>',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<div>{a && "b" ?? "c"}</div>',
      errors: [
        {messageId: 'noLiteralStringInJsx'},
        {messageId: 'noLiteralStringInJsx'},
      ],
    },
    // Children are not excluded when not specified
    {
      code: '<MenubarShortcut>Ctrl+C</MenubarShortcut>',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    {
      code: '<MenubarShortcut>{"Ctrl+C"}</MenubarShortcut>',
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    // Children exclusion is specific to the element
    {
      code: '<OtherComponent>text</OtherComponent>',
      options: [
        {
          props: {
            exclude: [['MenubarShortcut', 'children']],
          },
        },
      ],
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
    // Attributes are still checked even when children are excluded
    {
      code: '<MenubarShortcut aria-label="label">Ctrl+C</MenubarShortcut>',
      options: [
        {
          props: {
            exclude: [['MenubarShortcut', 'children']],
          },
        },
      ],
      errors: [{messageId: 'noLiteralStringInJsx'}],
    },
  ],
})
