// GH #4471: Test optional chaining with formatMessage
const intl = {}

export function testOptionalChaining() {
  // Case 1: Normal call (baseline - should work)
  intl.formatMessage({
    defaultMessage: 'Normal call',
    description: 'Test normal formatMessage call',
  })

  // Case 2: With optional chaining (should work)
  intl.formatMessage?.({
    defaultMessage: 'With optional chaining',
    description: 'Test formatMessage with optional chaining',
  })

  // Case 3: Nested optional chaining
  something?.intl?.formatMessage?.({
    defaultMessage: 'Nested optional chaining',
    description: 'Test nested optional chaining',
  })
}
