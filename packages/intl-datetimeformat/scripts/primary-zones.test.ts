import {expect, it} from 'vitest'
import {primaryZones} from './primary-zones.js'

it('preserves IANA Zone and country identities over CLDR alias groups', () => {
  const source =
    'Zone Africa/Abidjan 0 - GMT\nLink Africa/Abidjan Africa/Accra\nLink Africa/Abidjan Ghana\nZone CST6CDT -6 US C%sT\nZone America/Chicago -6 US C%sT\nZone Etc/GMT 0 - GMT\nLink Etc/GMT GMT\nLink Etc/GMT UTC'
  const entries = {
    ciabj: {_alias: 'Africa/Abidjan'},
    ghacc: {_alias: 'Africa/Accra Ghana'},
    uschi: {_alias: 'America/Chicago CST6CDT'},
    gmt: {_alias: 'Etc/GMT GMT UTC'},
  }
  expect(
    primaryZones([source], 'GH\t+0000+00000\tAfrica/Accra\n', entries)
  ).toEqual({Ghana: 'Africa/Accra', 'Etc/GMT': 'UTC', GMT: 'UTC'})
})

it('fails generation rather than guessing identity for unknown upstream aliases', () => {
  expect(() =>
    primaryZones(['Zone A/Zone 0 - UTC\nLink A/Zone B/Alias'], '', {})
  ).toThrow('Missing primary IANA timezone for B/Alias')
})
