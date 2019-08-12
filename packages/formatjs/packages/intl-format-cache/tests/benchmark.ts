#!/usr/bin/env node
'use strict';
import {Suite} from 'benchmark';
const memoize = require('fast-memoize');
import memoizeIntl from '../src';
import IntlMessageFormat from 'intl-messageformat';

function onCycle(ev: any) {
  console.log(String(ev.target));
}

function onComplete(this: any) {
  console.log(
    `--- ${this.name}: Fastest is ${this.filter('fastest').map('name')} ---`
  );
}

new Suite('NumberFormat cache set', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('fast-memoize', () =>
    memoize(Intl.NumberFormat)('ar', {style: 'percent'})
  )
  .add('intl-format-cache', () =>
    memoizeIntl(Intl.NumberFormat)('ar', {style: 'percent'})
  )
  .run();

const nfm = memoize(Intl.NumberFormat);
nfm('de', {style: 'percent'});
const nffc = memoizeIntl(Intl.NumberFormat);
nffc('de', {style: 'percent'});
new Suite('NumberFormat cache get', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('fast-memoize', () => nfm('de', {style: 'percent'}))
  .add('intl-format-cache', () => nffc('de', {style: 'percent'}))
  .add('not cached', () => new Intl.NumberFormat('de', {style: 'percent'}))
  .run();

new Suite('DateTimeFormat cache set', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('fast-memoize', () =>
    memoize(Intl.DateTimeFormat)('ar', {month: 'short'})
  )
  .add('intl-format-cache', () =>
    memoizeIntl(Intl.DateTimeFormat)('ar', {month: 'short'})
  )
  .run();

const dtm = memoize(Intl.DateTimeFormat);
dtm('de', {month: 'short'});
const dtfc = memoizeIntl(Intl.DateTimeFormat);
dtfc('de', {month: 'short'});
new Suite('DateTimeFormat cache get', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('fast-memoize', () => dtm('de', {month: 'short'}))
  .add('intl-format-cache', () => dtfc('de', {month: 'short'}))
  .add('not cached', () => new Intl.DateTimeFormat('de', {month: 'short'}))
  .run();

new Suite('IntlMessageFormat cache set', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('fast-memoize', () =>
    memoize(IntlMessageFormat)('message {token}', 'ar', {
      date: {
        verbose: {
          month: 'long',
        },
      },
    })
  )
  .add('intl-format-cache', () =>
    memoizeIntl(IntlMessageFormat)('message {token}', 'ar', {
      date: {
        verbose: {
          month: 'long',
        },
      },
    })
  )
  .run();

const mfm = memoize(IntlMessageFormat);
mfm('message {token}', 'ar', {
  date: {
    verbose: {
      month: 'long',
    },
  },
});
const mffc = memoizeIntl(IntlMessageFormat);
mffc('message {token}', 'ar', {
  date: {
    verbose: {
      month: 'long',
    },
  },
});
new Suite('IntlMessageFormat cache get', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('fast-memoize', () =>
    mfm('message {token}', 'ar', {
      date: {
        verbose: {
          month: 'long',
        },
      },
    })
  )
  .add('intl-format-cache', () =>
    mffc('message {token}', 'ar', {
      date: {
        verbose: {
          month: 'long',
        },
      },
    })
  )
  .add(
    'not cached',
    () =>
      new IntlMessageFormat('message {token}', 'ar', {
        date: {
          verbose: {
            month: 'long',
          },
        },
      })
  )
  .run();

mfm('message {token}', 'ar');
mffc('message {token}', 'ar');
new Suite('IntlMessageFormat cache get simple arg', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('fast-memoize', () => mfm('message {token}', 'ar'))
  .add('intl-format-cache', () => mffc('message {token}', 'ar'))
  .add('not cached', () => new IntlMessageFormat('message {token}', 'ar'))
  .run();

const now = Date.now();
new Suite('all formats', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('number', () => nffc('de', {style: 'percent'}).format(0.788))
  .add('datetime', () => dtfc('de', {month: 'short'}).format(now))
  .add('messageformat', () =>
    mffc('message {token}', 'ar').format({token: 'foo'})
  )
  .run();

new Suite('all formats random input', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('number', () => nffc('de', {style: 'percent'}).format(Math.random()))
  .add('datetime', () =>
    dtfc('de', {month: 'short'}).format(Math.random() * 1000 + Date.now())
  )
  .add('messageformat', () =>
    mffc('message {token}', 'ar').format({token: Math.random() * 10000})
  )
  .run();
