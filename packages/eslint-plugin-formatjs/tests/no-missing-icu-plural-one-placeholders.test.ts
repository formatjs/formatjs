import {name, rule} from '../rules/no-missing-icu-plural-one-placeholders.js'
import {ruleTester} from './util'

ruleTester.run(name, rule, {
  valid: [
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '1 should be valid',
                description: 'asd'
            })`,
      options: [],
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '<strong>1</strong> should be valid',
                description: 'asd'
            })`,
      options: [],
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: '{gender, select, male{1 male} female{1 female} other{other}} should be valid',
                description: 'asd'
            })`,
      options: [],
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: 'thanks to {1, plural, one {{1} photo} other {{1}+ photos}} plus',
                description: 'asd'
            })`,
      options: [],
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: 'maximum of {1, plural, one {# item} other {# items}}',
                description: 'asd'
            })`,
      options: [],
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: 'maximum of {1, plural, one {{1} # item} other {{1} # items}}',
                description: 'asd'
            })`,
      options: [],
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: 'maximum of {1, plural, one {<strong>#</strong> item} other {# items}}',
                description: 'asd'
            })`,
      options: [],
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: 'another {1, plural, one {#-day} other {#-day}} trial',
                description: 'asd'
            })`,
      options: [],
    },
  ],
  invalid: [
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: "maximum of {0, plural, one {1 item} other {# items}}",
                description: 'asd'
            })`,
      options: [],
      errors: [
        {
          messageId: 'noMissingIcuPluralOnePlaceholders',
        },
      ],
      output: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: "maximum of {0, plural, one {# item} other {# items}}",
                description: 'asd'
            })`,
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: "maximum of {0, plural, one {{2} 1 item} other {{2} # items}}",
                description: 'asd'
            })`,
      options: [],
      errors: [
        {
          messageId: 'noMissingIcuPluralOnePlaceholders',
        },
      ],
      output: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: "maximum of {0, plural, one {{2} # item} other {{2} # items}}",
                description: 'asd'
            })`,
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: "maximum of {0, plural, one {<strong>1</strong> item} other {# items}}",
                description: 'asd'
            })`,
      options: [],
      errors: [
        {
          messageId: 'noMissingIcuPluralOnePlaceholders',
        },
      ],
      output: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: "maximum of {0, plural, one {<strong>#</strong> item} other {# items}}",
                description: 'asd'
            })`,
    },
    {
      code: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: "another {0, plural, one {1-day} other {#-day}} trial",
                description: 'asd'
            })`,
      options: [],
      errors: [
        {
          messageId: 'noMissingIcuPluralOnePlaceholders',
        },
      ],
      output: `import {defineMessage} from 'react-intl'
            defineMessage({
                defaultMessage: "another {0, plural, one {#-day} other {#-day}} trial",
                description: 'asd'
            })`,
    },
  ],
})
