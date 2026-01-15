import {memoize, strategies} from '@formatjs/fast-memoize'

/**
 * Implementation: Memoized factory for Intl.DateTimeFormat instances
 *
 * Creates and caches DateTimeFormat instances to avoid repeated instantiation overhead.
 * This is critical for performance since we test many candidate values against formatters.
 *
 * Uses variadic memoization strategy to handle varying numbers of constructor arguments.
 */
export const createMemoizedDateTimeFormat: (
  ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
) => Intl.DateTimeFormat = memoize(
  (...args: ConstructorParameters<typeof Intl.DateTimeFormat>) =>
    new Intl.DateTimeFormat(...args),
  {
    strategy: strategies.variadic,
  }
)
