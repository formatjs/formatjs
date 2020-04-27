import supportedDatetimeSkeleton from '../src/rules/supported-datetime-skeleton';
import {ruleTester} from './util';
import {dynamicMessage, noMatch, spreadJsx, emptyFnCall} from './fixtures';
ruleTester.run('supported-datetime-skeleton', supportedDatetimeSkeleton, {
  valid: [
    `import {_} from '@formatjs/macro'
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
              import {_} from '@formatjs/macro'
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
              import {_} from '@formatjs/macro'
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
