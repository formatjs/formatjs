export type CoreMessageIds = 'parseError'

export const CORE_MESSAGES: Record<CoreMessageIds, string> = {
  parseError: `Failed to parse message string {{error}}`,
}
