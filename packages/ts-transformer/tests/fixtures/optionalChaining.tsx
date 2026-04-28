// @ts-ignore
const intl = {} as any

function getUsers(): Array<string> | undefined {
  return undefined;
}

// GH #4471: Test optional chaining with generics
export function testOptionalChainingWithGenerics(): void {
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

  // Case 6: formatMessage nested in a callback inside an optional chain.
  getUsers()?.map(() =>
    intl.formatMessage(
      {
        defaultMessage: 'In a callback inside an optional chain',
        description: 'Test callbacks inside an optional chain',
      },
    ),
  ).join(', ')
}
