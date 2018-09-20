import React from 'react';

const {createRenderer} = require(
  (React.version < '15.5')
    ? 'react-addons-test-utils'
    : 'react-test-renderer/shallow'
);

export {createRenderer};
