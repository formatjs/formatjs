import {ruleTester} from './util';
import noCamelCase from '../src/rules/no-camel-case';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';

ruleTester.run('no-camel-case', noCamelCase, {
  valid: [
    `import {_} from '@formatjs/macro'
  _({
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
              import {_} from '@formatjs/macro'
              _({
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
