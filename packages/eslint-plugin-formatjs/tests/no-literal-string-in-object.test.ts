import {rule, name} from '../rules/no-literal-string-in-object'
import {ruleTester, vueRuleTester} from './util'
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures'

ruleTester.run(name, rule, {
  valid: [
    // Translated property
    {
      code: `
        const obj = {
          label: intl.formatMessage({defaultMessage: 'Translated label'})
        }
      `,
    },
    // Custom translation function
    {
      code: `
            const obj = {
              label: customTranslateFn('Translated label')
            }
          `,
    },
    // Non-targeted properties
    {
      code: `
        const obj = {
          tag: 'Untranslated tag',
        }
      `,
    },
    // Non-targeted properties with custom property list
    {
      code: `
        const obj = {
          label: 'Untranslated label',
        }
      `,
      options: [
        {
          include: ['tag'],
        },
      ],
    },
    // Properties that aren't strings
    {
      code: `
        const obj = {
          label: 42,
          count: 1
        }
      `,
    },
    // Not an object literal
    noMatch,
    dynamicMessage,
    emptyFnCall,
    spreadJsx,
  ],
  invalid: [
    // Basic case - string literal
    {
      code: `
        const obj = {
          label: 'Untranslated label'
        }
      `,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
    // Template literal
    {
      code: `
        const obj = {
          label: \`Template literal value\`
        }
      `,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
    // Multi-part template literal
    {
      code: `
            const obj = {
              label: \`$\{intl.formatMessage({defaultMessage: 'Translated part'})} $\{intl.formatMessage({defaultMessage: 'Translated part'})}\`
            }
          `,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
    // String concatenation
    {
      code: `
        const obj = {
          label: 'Untranslated ' + 'concatenated label'
        }
      `,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
    // Conditional expression
    {
      code: `
        const obj = {
          label: isError ? 'Error message' : intl.formatMessage({defaultMessage: 'Success message'})
        }
      `,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
    // Logical expression
    {
      code: `
        const obj = {
          label: errorMessage || 'Default error message'
        }
      `,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
    // Custom property config
    {
      code: `
        const obj = {
          title: 'Untranslated title',
          description: 'Some description'
        }
      `,
      options: [
        {
          include: ['title', 'description'],
        },
      ],
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'title',
          },
        },
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'description',
          },
        },
      ],
    },
    // String key
    {
      code: `
        const obj = {
          'label': 'Untranslated label with string key'
        }
      `,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
    // Long string (truncated in error message)
    {
      code: `
        const obj = {
          label: 'This is a very long untranslated label that should be truncated in the error message'
        }
      `,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
  ],
})

// Vue tests
vueRuleTester.run(`vue-${name}`, rule, {
  valid: [
    {
      code: `
      <template>
        <div>{{ $formatMessage({ defaultMessage: 'Translated text' }) }}</div>
      </template>
      <script>
      export default {
        data() {
          return {
            item: {
              label: this.$formatMessage({ defaultMessage: 'Translated label' })
            }
          }
        }
      }
      </script>`,
    },
    {
      code: `
      <template>
        <div>{{ label }}</div>
      </template>
      <script>
      export default {
        data() {
          return {
            item: {
              title: 'Untranslated title'
            }
          }
        }
      }
      </script>`,
    },
  ],
  invalid: [
    {
      code: `
      <template>
        <div>{{ label }}</div>
      </template>
      <script>
      export default {
        data() {
          return {
            item: {
              label: 'Untranslated label'
            }
          }
        }
      }
      </script>`,
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'label',
          },
        },
      ],
    },
    {
      code: `
      <script>
      export default {
        data() {
          return {
            config: {
              title: 'Untranslated title',
              description: 'Description text'
            }
          }
        }
      }
      </script>`,
      options: [
        {
          include: ['title', 'description'],
        },
      ],
      errors: [
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'title',
          },
        },
        {
          messageId: 'untranslatedProperty',
          data: {
            propertyKey: 'description',
          },
        },
      ],
    },
  ],
})
