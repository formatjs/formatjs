import {IsValidTimeZoneName} from '../IsValidTimeZoneName'
import {expect, test} from 'vitest'
test('IsValidTimeZoneName', () => {
  expect(
    IsValidTimeZoneName('America/Los_Angeles', {
      zoneNamesFromData: ['America/Los_Angeles'],
      uppercaseLinks: {},
    })
  ).toBe(true)

  expect(
    IsValidTimeZoneName('America/Indiana/Indianapolis', {
      zoneNamesFromData: [
        'America/Indianapolis',
        'America/Fort_Wayne',
        'US/East-Indiana',
      ],
      uppercaseLinks: {
        'America/Fort_Wayne': 'America/Indiana/Indianapolis',
        'America/Indianapolis': 'America/Indiana/Indianapolis',
        'US/East-Indiana': 'America/Indiana/Indianapolis',
      },
    })
  ).toBe(true)

  expect(
    IsValidTimeZoneName('America/Indiana/Indianapolis', {
      zoneNamesFromData: ['America/New_York'],
      uppercaseLinks: {
        'America/Fort_Wayne': 'America/Indiana/Indianapolis',
        'America/Indianapolis': 'America/Indiana/Indianapolis',
        'US/East-Indiana': 'America/Indiana/Indianapolis',
      },
    })
  ).toBe(true)
})
