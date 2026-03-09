import {RuleTester} from 'eslint'
import {describe, it} from 'vitest'
import {name, rule} from '../rules/prefer-direction-agnostic.js'
import {stylesheetParser} from './stylesheet-parser'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser: stylesheetParser,
  },
})

ruleTester.run(name, rule, {
  valid: [
    {
      code: '.foo { margin-inline-start: 1rem; text-align: start; }',
      filename: 'styles.css',
    },
    {
      code: '.foo { border-inline-end-color: red; clear: inline-end; }',
      filename: 'styles.less',
    },
    {
      code: '.foo\n  padding-inline-end: 8px\n  float: inline-start\n',
      filename: 'styles.sass',
    },
    {
      code: '.foo { margin-left: 1rem; }',
      filename: 'component.tsx',
    },
    {
      code: '/* right: 0; */\n.foo { content: "margin-left"; }',
      filename: 'styles.css',
    },
    {
      code: '// margin-left: 1rem;\n$offset-left: 4px;\n.foo { text-align: start; }',
      filename: 'styles.scss',
    },
    {
      code: '@sidebar-width: 20px;\n.foo { clear: inline-start; }',
      filename: 'styles.less',
    },
    {
      code: '.foo\n  // padding-right: 4px\n  $space-left: 8px\n  content: "left"\n',
      filename: 'styles.sass',
    },
    {
      code: '@media (min-width: 40rem) { .foo { margin-inline-end: 1rem; } }',
      filename: 'styles.css',
    },
  ],
  invalid: [
    {
      code: '.foo { margin-left: 1rem; }',
      filename: 'styles.css',
      output: '.foo { margin-inline-start: 1rem; }',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'margin-left',
            replacement: 'margin-inline-start',
          },
        },
      ],
    },
    {
      code: '.foo { text-align: right; float: left; }',
      filename: 'styles.scss',
      output: '.foo { text-align: end; float: inline-start; }',
      errors: [
        {
          messageId: 'preferValue',
          data: {
            actual: 'right',
            replacement: 'end',
          },
        },
        {
          messageId: 'preferValue',
          data: {
            actual: 'left',
            replacement: 'inline-start',
          },
        },
      ],
    },
    {
      code: '.foo { border-top-left-radius: 4px; right: 0; }',
      filename: 'styles.less',
      output: '.foo { border-start-start-radius: 4px; inset-inline-end: 0; }',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'border-top-left-radius',
            replacement: 'border-start-start-radius',
          },
        },
        {
          messageId: 'preferProperty',
          data: {
            actual: 'right',
            replacement: 'inset-inline-end',
          },
        },
      ],
    },
    {
      code: '.foo\n  margin-right: 1rem\n  text-align: left\n',
      filename: 'styles.sass',
      output: '.foo\n  margin-inline-end: 1rem\n  text-align: start\n',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'margin-right',
            replacement: 'margin-inline-end',
          },
        },
        {
          messageId: 'preferValue',
          data: {
            actual: 'left',
            replacement: 'start',
          },
        },
      ],
    },
    {
      code: '/* margin-left: 1rem; */\n.foo { padding-right: 1rem; }',
      filename: 'styles.css',
      output: '/* margin-left: 1rem; */\n.foo { padding-inline-end: 1rem; }',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'padding-right',
            replacement: 'padding-inline-end',
          },
        },
      ],
    },
    {
      code: '.foo { left: 0; border-left-width: 1px; clear: right; }',
      filename: 'styles.css',
      output:
        '.foo { inset-inline-start: 0; border-inline-start-width: 1px; clear: inline-end; }',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'left',
            replacement: 'inset-inline-start',
          },
        },
        {
          messageId: 'preferProperty',
          data: {
            actual: 'border-left-width',
            replacement: 'border-inline-start-width',
          },
        },
        {
          messageId: 'preferValue',
          data: {
            actual: 'right',
            replacement: 'inline-end',
          },
        },
      ],
    },
    {
      code: '// right: 0;\n.foo { margin-left: 1rem; text-align: left; }\n',
      filename: 'styles.scss',
      output:
        '// right: 0;\n.foo { margin-inline-start: 1rem; text-align: start; }\n',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'margin-left',
            replacement: 'margin-inline-start',
          },
        },
        {
          messageId: 'preferValue',
          data: {
            actual: 'left',
            replacement: 'start',
          },
        },
      ],
    },
    {
      code: '@gap: 1rem;\n.foo { border-right-style: solid; float: right; }\n',
      filename: 'styles.less',
      output:
        '@gap: 1rem;\n.foo { border-inline-end-style: solid; float: inline-end; }\n',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'border-right-style',
            replacement: 'border-inline-end-style',
          },
        },
        {
          messageId: 'preferValue',
          data: {
            actual: 'right',
            replacement: 'inline-end',
          },
        },
      ],
    },
    {
      code: '.card\n  border-bottom-right-radius: 12px\n  float: left\n  // margin-right: 1rem\n',
      filename: 'styles.sass',
      output:
        '.card\n  border-end-end-radius: 12px\n  float: inline-start\n  // margin-right: 1rem\n',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'border-bottom-right-radius',
            replacement: 'border-end-end-radius',
          },
        },
        {
          messageId: 'preferValue',
          data: {
            actual: 'left',
            replacement: 'inline-start',
          },
        },
      ],
    },
    {
      code: '.foo { margin-left: 1rem; padding-right: 2rem; border-right-color: red; }',
      filename: 'styles.css',
      output:
        '.foo { margin-inline-start: 1rem; padding-inline-end: 2rem; border-inline-end-color: red; }',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'margin-left',
            replacement: 'margin-inline-start',
          },
        },
        {
          messageId: 'preferProperty',
          data: {
            actual: 'padding-right',
            replacement: 'padding-inline-end',
          },
        },
        {
          messageId: 'preferProperty',
          data: {
            actual: 'border-right-color',
            replacement: 'border-inline-end-color',
          },
        },
      ],
    },
    {
      code: '@media (min-width: 40rem) { .foo { text-align: left !important; } }',
      filename: 'styles.css',
      output:
        '@media (min-width: 40rem) { .foo { text-align: start !important; } }',
      errors: [
        {
          messageId: 'preferValue',
          data: {
            actual: 'left',
            replacement: 'start',
          },
        },
      ],
    },
    {
      code: '$gap: 1rem;\n.container {\n  .item { margin-left: $gap; }\n  text-align: right;\n}\n',
      filename: 'styles.scss',
      output:
        '$gap: 1rem;\n.container {\n  .item { margin-inline-start: $gap; }\n  text-align: end;\n}\n',
      errors: [
        {
          messageId: 'preferProperty',
          data: {
            actual: 'margin-left',
            replacement: 'margin-inline-start',
          },
        },
        {
          messageId: 'preferValue',
          data: {
            actual: 'right',
            replacement: 'end',
          },
        },
      ],
    },
  ],
})
