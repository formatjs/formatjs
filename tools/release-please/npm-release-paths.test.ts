import assert from 'node:assert/strict'

import {collectNpmReleasePaths} from './npm-release-paths.ts'

assert.deepEqual(
  collectNpmReleasePaths(
    {
      'crates/parser': '1.0.0',
      'packages/parser': '1.0.0',
      'packages/plugin': '2.0.0',
    },
    {
      'crates/parser': '1.1.0',
      'packages/parser': '1.1.0',
      'packages/plugin': '2.0.0',
    },
    []
  ),
  ['packages/parser']
)

assert.deepEqual(
  collectNpmReleasePaths(
    {'packages/parser': '1.0.0'},
    {'packages/parser': '1.1.0', 'packages/plugin': '2.0.0'},
    ['packages/plugin', 'crates/parser']
  ),
  ['packages/plugin', 'packages/parser']
)

console.log('Verified npm release path recovery')
