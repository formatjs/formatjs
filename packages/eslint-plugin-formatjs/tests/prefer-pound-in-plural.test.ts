import {name, rule} from '../rules/prefer-pound-in-plural.js'
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
        defaultMessage: \`I have {
          count, plural,
            one {an apple}
            other {# apples}
        }.\`
      })
    `,
    },
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: \`I have {
          count, plural,
            one {an apple}
            other {some apples}
        }.\`
      })
    `,
    },
    // Ignore number argument with style option
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: \`I have {count, number, integer} {
          count, plural,
            one {apple}
            other {apples}
        }.\`
      })
    `,
    },
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: \`I have {
          count, plural,
            one {{count, number, integer} apple}
            other {{count, number, integer} apples}
        }.\`
      })
    `,
    },
    // Does not reach into nested plural argument
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: \`I have {
          appleCount, plural,
            one {{
              pearCount, plural,
                one {an apple and a pear}
                other {an apple and # pears}
            }}
            other {{
              pearCount, plural,
                one {{appleCount} apple and a pear}
                other {{appleCount} apple and # pears}
            }}
        }.\`
      })
    `,
    },
    // Checks the matching argument name
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: \`I have {meh} {
          count, plural,
            one {apple}
            other {apples}
        }.\`
      })
    `,
    },
    {
      code: `
      import {defineMessage} from 'react-intl'
      defineMessage({
        defaultMessage: \`I have {
          count, plural,
            one {{meh} apple}
            other {{meh} apples}
        }.\`
      })
    `,
    },
  ],
  invalid: [
    // Sink the argument preceding the plural argument as `#` into the plural clauses.
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {count} {
            count, plural,
              one {apple}
              other {apples}
          }.\`
        })
      `,
      errors: [{messageId: 'preferPoundInPlurals'}],
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {# apple}
              other {# apples}
          }.\`
        })
      `,
    },
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {count, number} {
            count, plural,
              one {apple}
              other {apples}
          }.\`
        })
      `,
      errors: [{messageId: 'preferPoundInPlurals'}],
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {# apple}
              other {# apples}
          }.\`
        })
      `,
    },
    // Replace the argument in the plural clause with `#` if applicable.
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {{count} apple}
              other {{count} apples}
          }.\`
        })
      `,
      errors: [{messageId: 'preferPoundInPlurals'}],
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {# apple}
              other {# apples}
          }.\`
        })
      `,
    },
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {{count, number} apple}
              other {{count, number} apples}
          }.\`
        })
      `,
      errors: [{messageId: 'preferPoundInPlurals'}],
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {# apple}
              other {# apples}
          }.\`
        })
      `,
    },
    // Empty clause
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {count} {
            count, plural,
              one {apple}
              other {}
          }.\`
        })
      `,
      errors: [{messageId: 'preferPoundInPlurals'}],
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {# apple}
              other {# }
          }.\`
        })
      `,
    },
    // Complex example with tags and select argument
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {<b>{count}</b> apple}
              other {{
                hasPears, select,
                  true {<b>{count}</b> apples and some pears}
                  other {<b>{count}</b> apples}
              }}
          }.\`
        })
      `,
      errors: [{messageId: 'preferPoundInPlurals'}],
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {<b>#</b> apple}
              other {{
                hasPears, select,
                  true {<b>#</b> apples and some pears}
                  other {<b>#</b> apples}
              }}
          }.\`
        })
      `,
    },
    // Select ordinal
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I won the {ranking}{
            ranking, selectordinal,
              one {st}
              two {nd}
              few {rd}
              other {th}
          } place.\`
        })
      `,
      errors: [{messageId: 'preferPoundInPlurals'}],
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I won the {
            ranking, selectordinal,
              one {#st}
              two {#nd}
              few {#rd}
              other {#th}
          } place.\`
        })
      `,
    },
    // Two cases together
    {
      code: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {count} {
            count, plural,
              one {{count} apple}
              other {{count} apples}
          }.\`
        })
      `,
      errors: [{messageId: 'preferPoundInPlurals'}],
      output: `
        import {defineMessage} from 'react-intl'
        defineMessage({
          defaultMessage: \`I have {
            count, plural,
              one {# # apple}
              other {# # apples}
          }.\`
        })
      `,
    },
  ],
})
