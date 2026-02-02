import {defineMessages} from 'react-intl';

// This should extract successfully
const messages1 = defineMessages({
  validMessage1: {
    defaultMessage: 'This is a valid message',
  },
  validMessage2: {
    defaultMessage: 'Another valid message',
  },
});

// This has a dynamic ID that should cause an error with idInterpolationPattern
const dynamicKey = 'dynamic';
const messages2 = defineMessages({
  [dynamicKey]: {
    defaultMessage: 'This has a dynamic key',
  },
});

// This should extract successfully
const messages3 = defineMessages({
  validMessage3: {
    defaultMessage: 'Yet another valid message',
  },
});
