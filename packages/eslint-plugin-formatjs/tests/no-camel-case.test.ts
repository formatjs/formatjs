import {ruleTester} from './util';
import noCamelCase from '../rules/no-camel-case';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';

ruleTester.run('no-camel-case', noCamelCase, {
  valid: [
    `import {defineMessage} from 'react-intl'
  defineMessage({
      defaultMessage: 'a {placeholder}',
      description: 'asd'
  })`,
    dynamicMessage,
    noMatch,
    spreadJsx,
    emptyFnCall,
  ],
  invalid: [
    {
      code: `
              import {defineMessage} from 'react-intl'
              defineMessage({
                  defaultMessage: 'a {placeHolder}'
              })`,
      errors: [
        {
          message: 'Camel case arguments are not allowed',
        },
      ],
    },
  ],
});
