// @ts-ignore
const intl = {} as any

// GH #4471: Test optional chaining with generics
export function testOptionalChainingWithGenerics() {
  // Case 1: Normal call (baseline - should work)
  intl.formatMessage({
    defaultMessage: 'Normal call',
    description: 'Test normal formatMessage call',
  })

  // Case 2: With generics only (baseline - should work)
  intl.formatMessage<HTMLElement>({
    defaultMessage: 'With generics',
    description: 'Test formatMessage with generic type',
  })

  // Case 3: With optional chaining only (should work)
  intl.formatMessage?.({
    defaultMessage: 'With optional chaining',
    description: 'Test formatMessage with optional chaining',
  })

  // Case 4: With both generics and optional chaining (the problematic case - should now work)
  intl.formatMessage<HTMLElement>?.({
    defaultMessage: 'With both generics and optional chaining',
    description:
      'Test formatMessage with both generic type and optional chaining',
  })

  // Case 5: Nested optional chaining
  something?.intl?.formatMessage?.({
    defaultMessage: 'Nested optional chaining',
    description: 'Test nested optional chaining',
  })
}
