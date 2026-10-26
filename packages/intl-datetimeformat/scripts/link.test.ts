import {expect, it} from 'vitest'
import {parseLinks} from './link.js'

it('extracts Link records without treating Zone offsets or comments as aliases', () => {
  const source = [
    '# IANA backward data',
    'Zone EST5EDT -5:00 US E%sT',
    'Link America/New_York US/Eastern',
    '  Link\tEtc/GMT\tGMT0 # equivalent UTC name',
    '\t# indented comment',
    '   ',
  ].join('\n')
  expect(parseLinks(source)).toEqual({
    'US/Eastern': 'America/New_York',
    GMT0: 'Etc/GMT',
  })
})
