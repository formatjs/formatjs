export const instantInputs: string[][] = [
  [
    '1970-01-01T00:00:00.000000001Z',
    '2000-02-29T12:34:56.123456789+05:30',
    '1969-12-31T23:59:59.999999999Z',
    '2026-11-15T12:30:00Z',
  ],
  [
    '-271821-04-20T00:00:00Z',
    '+275760-09-13T00:00:00Z',
    '+275760-09-13T23:59:59.999999999+23:59:59.999999999',
    '1970-01-01T00Z[!America/New_York][u-ca=hebrew]',
  ],
]
export const durationInputs: string[][] = [
  ['PT1H2M3.123456789S', '-PT0.000000001S', 'P1DT23H59M59.999999999S', 'PT0S'],
  [
    'PT9007199254740991.999999999S',
    '-PT9007199254740991.999999999S',
    'PT9007199.254740993S',
    'PT1.000000001H',
  ],
]
export const operationNames: string[] = [
  'Instant parse/epoch string',
  'Instant parse/round microsecond/epoch string',
  'Instant parse/format UTC',
  'Duration parse/format',
  'Duration parse/total microseconds',
]
