import supportedDatetimeSkeleton from '../src/rules/supported-datetime-skeleton';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('supported-datetime-skeleton', supportedDatetimeSkeleton, {
  valid: [
    `import {defineMessage} from 'react-intl'
  _({
      defaultMessage: '{ts, date, ::yyyyMMdd}'
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
              _({
                  defaultMessage: '{ts, date, ::yQQQHm}'
              })`,
      errors: [
        {
          message: '`q/Q` (quarter) patterns are not supported',
        },
      ],
    },
    {
      code: `
              import {defineMessage} from 'react-intl'
              _({
                  defaultMessage: '{ts, date, ::DFg}'
              })`,
      errors: [
        {
          message: '`D/F/g` (day) patterns are not supported, use `d` instead',
        },
      ],
    },
  ],
});
